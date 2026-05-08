package com.pingme.chats.members;

import com.pingme.chats.Chat;
import com.pingme.chats.members.dto.UpdateRole;
import com.pingme.contacts.Contact;
import com.pingme.contacts.ContactService;
import com.pingme.exceptions.BadRequestException;
import com.pingme.exceptions.ForbiddenException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatMemberService {

    private final ChatMemberRepository chatMemberRepository;
    private final ContactService contactService;

    public ChatMember getChatMember(String chatId, String userId) {
        return chatMemberRepository.findByChatIdAndUserId(chatId, userId)
                .orElseThrow(() -> new ForbiddenException("User is not a member of this chat"));
    }

    public List<ChatMember> getUserChats(String userId) {
        return chatMemberRepository.findByUserIdAndActiveTrue(userId);
    }

    public List<ChatMember> getChatMembers(String chatId) {
        return chatMemberRepository.findByChatId(chatId);
    }

    public List<ChatMember> getChatMembers(String chatId, int page, int size) {
        int skip = page * size;
        return chatMemberRepository.findPagedMembers(chatId, skip, size);
    }

    public long getTotalMembers(String chatId) {
        return chatMemberRepository.countByChatIdAndActiveTrue(chatId);
    }

    public void markAsRead(String chatId, String userId, String messageId) {
        ChatMember member = getChatMember(chatId, userId);
        member.setLastReadMessageId(messageId);

        chatMemberRepository.save(member);
    }

    public void leaveChat(String chatId, String userId) {
        ChatMember member = getChatMember(chatId, userId);

        if(member.isActive()) {
            member.setRole(ChatRole.MEMBER);
            member.setActive(false);
            chatMemberRepository.save(member);
        }
    }

    public void saveAll(List<ChatMember> members) {
        chatMemberRepository.saveAll(members);
    }

    public boolean exists(String chatId, String userId) {
        return chatMemberRepository.findByChatIdAndUserId(chatId, userId).isPresent();
    }

    public List<ChatMember> getOtherMembers(List<String> chatIds, String userId) {
        return chatMemberRepository.findByChatIdInAndUserIdNot(chatIds, userId);
    }

    public void updateRole(String chatId, String currentUserId, @Valid UpdateRole data) {
        if (currentUserId.equals(data.userId())) {
            throw new ForbiddenException("You cannot modify yourself");
        }

        ChatMember currentUser = getChatMember(chatId, currentUserId);
        ChatMember otherUser = getChatMember(chatId, data.userId());

        if(otherUser.getRole() == ChatRole.ADMIN || currentUser.getRole() != ChatRole.ADMIN) {
            throw new ForbiddenException("Only admins can modify other person's role");
        }

        otherUser.setRole(data.role());
        chatMemberRepository.save(otherUser);

        if(data.role() == ChatRole.ADMIN) {
            currentUser.setRole(ChatRole.MODERATOR);
            chatMemberRepository.save(currentUser);
        }
    }

    public void kickMember(String chatId, String currentUserId, String memberId) {
        if (currentUserId.equals(memberId)) {
            throw new ForbiddenException("You cannot kick yourself");
        }

        ChatMember currentUser = getChatMember(chatId, currentUserId);
        ChatMember otherUser = getChatMember(chatId, memberId);

        ChatRole currentUserRole = currentUser.getRole();
        ChatRole otherUserRole = otherUser.getRole();

        if (otherUserRole == ChatRole.ADMIN) {
            throw new ForbiddenException("You cannot modify the admin");
        }

        if (currentUserRole == ChatRole.MEMBER) {
            throw new ForbiddenException("Members cannot perform this action");
        }

        if (currentUserRole == ChatRole.MODERATOR && otherUserRole == ChatRole.MODERATOR) {
            throw new ForbiddenException("Moderators cannot kick other moderators");
        }

        otherUser.setRole(ChatRole.MEMBER);
        otherUser.setActive(false);
        chatMemberRepository.save(otherUser);
    }

    public void addMembers(String chatId, String currentUserId, List<String> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            throw new BadRequestException("Members to add is empty");
        }

        ChatMember currentUser = getChatMember(chatId, currentUserId);

        if(currentUser.getRole() == ChatRole.MEMBER) {
            throw new ForbiddenException("You don't have permission to add other persons");
        }

        Set<String> memberSet = new HashSet<>(memberIds);
        List<Contact> userContacts = contactService.getContactsBetween(currentUserId, memberSet);
        Set<String> allowedIds = userContacts.stream()
                .map(c -> c.getSenderId().equals(currentUserId) ?
                            c.getReceiverId() :
                            c.getSenderId())
                .collect(Collectors.toSet());

        List<ChatMember> membersToReactivate = chatMemberRepository.findByChatIdAndUserIdInAndActiveFalse(chatId, allowedIds);
        membersToReactivate.forEach(m -> m.setActive(true));
        chatMemberRepository.saveAll(membersToReactivate);

        Set<String> reactivatedIds = membersToReactivate.stream()
                .map(ChatMember::getUserId)
                .collect(Collectors.toSet());

        Set<String> finalNewMembers = new HashSet<>(allowedIds);
        finalNewMembers.removeAll(reactivatedIds);

        List<ChatMember> newChatMembers = finalNewMembers.stream()
                .map(id ->
                        ChatMember.builder()
                                .chatId(chatId)
                                .userId(id)
                                .role(ChatRole.MEMBER)
                                .muted(false)
                                .active(true)
                                .lastReadMessageId(null)
                                .build()
                )
                .toList();

        chatMemberRepository.saveAll(newChatMembers);
    }

    public void muteChat(String chatId, String currentUserId) {
        ChatMember currentUser = getChatMember(chatId, currentUserId);
        currentUser.setMuted(!currentUser.isMuted());
        chatMemberRepository.save(currentUser);
    }

    public ChatMember activateChatMember(ChatMember chatMember) {
        if(chatMember.isActive()) {
            return chatMember;
        }

        chatMember.setActive(true);
        return chatMemberRepository.save(chatMember);
    }

    public void transferOwnerShip(String chatId, String currentUserId, String memberId) {
        if (currentUserId.equals(memberId)) {
            throw new ForbiddenException("You cannot transfer ownership to yourself");
        }

        ChatMember currentUser = getChatMember(chatId, currentUserId);

        if(currentUser.getRole() != ChatRole.ADMIN) {
            throw new ForbiddenException("You don't have permission to transfer the ownership of this chat.");
        }

        ChatMember otherUser = getChatMember(chatId, memberId);
        otherUser.setRole(ChatRole.ADMIN);
        currentUser.setRole(ChatRole.MODERATOR);

        chatMemberRepository.saveAll(List.of(currentUser, otherUser));
    }
}