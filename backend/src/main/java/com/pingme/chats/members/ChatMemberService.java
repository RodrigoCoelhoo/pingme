package com.pingme.chats.members;

import com.pingme.chats.Chat;
import com.pingme.chats.ChatRepository;
import com.pingme.chats.ChatType;
import com.pingme.chats.dto.ChatPreview;
import com.pingme.chats.events.ChatEvent;
import com.pingme.chats.events.ChatEventType;
import com.pingme.chats.members.dto.UpdateRole;
import com.pingme.contacts.Contact;
import com.pingme.contacts.ContactService;
import com.pingme.shared.WebsocketBroadcaster;
import com.pingme.shared.exceptions.ForbiddenException;
import com.pingme.shared.exceptions.ResourceNotFound;
import com.pingme.messages.Message;
import com.pingme.messages.MessageService;
import com.pingme.messages.dto.MessageResponse;
import com.pingme.messages.system.SystemEventType;
import com.pingme.messages.system.SystemMessageContent;
import com.pingme.users.User;
import com.pingme.users.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatMemberService {

    private final ChatMemberRepository chatMemberRepository;
    private final ContactService contactService;
    private final ChatRepository chatRepository;
    private final MessageService messageService;
    private final UserService userService;
    private final WebsocketBroadcaster websocketBroadcaster;

    public ChatMember getChatMember(String chatId, String userId) {
        return chatMemberRepository.findByChatIdAndUserId(chatId, userId)
                .orElseThrow(() -> new ForbiddenException("User is not a member of this chat"));
    }

    public List<ChatMember> getUserChats(String userId) {
        return chatMemberRepository.findByUserIdAndActiveTrue(userId);
    }

    public List<ChatMember> getChatMembers(String chatId) {
        Optional<Chat> c = chatRepository.findById(chatId);

        if(c.isEmpty()) throw new ResourceNotFound("Chat not found");
        Chat chat = c.get();

        if(chat.getChatType() == ChatType.PRIVATE) {
            return chatMemberRepository.findByChatId(chatId);
        }

        return chatMemberRepository.findByChatIdAndActiveTrue(chatId);
    }

    public List<ChatMember> getChatMembers(String chatId, int page, int size, String search) {
        int skip = page * size;
        String safeSearch = (search == null || search.isBlank()) ? "" : search;

        return chatMemberRepository.findPagedMembers(chatId, skip, size, safeSearch);
    }

    public List<String> getMemberIds(String chatId) {
        return getChatMembers(chatId)
                .stream()
                .map(ChatMember::getUserId)
                .toList();
    }

    public long getTotalMembers(String chatId, String search) {
        Long totalCount = chatMemberRepository.countMembersWithSearch(chatId, search);
        return totalCount != null ? totalCount : 0L;
    }

    public void markAsRead(String chatId, String userId, String messageId) {
        ChatMember member = getChatMember(chatId, userId);
        member.setLastReadMessageId(messageId);

        chatMemberRepository.save(member);
    }

    public void leaveChat(String chatId, String userId) {
        ChatMember member = getChatMember(chatId, userId);
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFound("Chat not found"));

        if(chat.getChatType() == ChatType.PRIVATE) {
            if(member.isActive()) {
                member.setActive(false);
                chatMemberRepository.save(member);
            }
        }
        else {
            if(member.getRole() == ChatRole.ADMIN) {
                throw new ForbiddenException("You can't leave a group while you're ADMIN");
            }

            if(member.isActive()) {
                member.setRole(ChatRole.MEMBER);
                member.setActive(false);
                chatMemberRepository.save(member);

                User user = userService.getUserById(userId);
                broadcastSystemMessage(chat, SystemMessageContent.of(SystemEventType.MEMBER_LEFT, user.getUsername()));
            }
        }
    }

    public void saveAll(List<ChatMember> members) {
        chatMemberRepository.saveAll(members);
    }

    public void deleteAll(List<ChatMember> members) {
        chatMemberRepository.deleteAll(members);
    }

    public boolean exists(String chatId, String userId) {
        return chatMemberRepository.findByChatIdAndUserId(chatId, userId).isPresent();
    }

    public void updateRole(String chatId, String currentUserId, @Valid UpdateRole data) {
        if (currentUserId.equals(data.userId())) {
            throw new ForbiddenException("You cannot modify yourself");
        }

        ChatMember currentUser = getChatMember(chatId, currentUserId);
        if(currentUser.getRole() != ChatRole.ADMIN) {
            throw new ForbiddenException("Only admins can modify other person's role");
        }

        ChatMember otherUser = getChatMember(chatId, data.userId());
        otherUser.setRole(data.role());
        chatMemberRepository.save(otherUser);

        SystemEventType eventType;
        ChatRole role;
        if(data.role() == ChatRole.ADMIN) {
            currentUser.setRole(ChatRole.MODERATOR);
            chatMemberRepository.save(currentUser);
            websocketBroadcaster.broadcastEvent(
                    List.of(currentUser.getUserId()),
                    ChatEvent.of(ChatEventType.MEMBER_ROLE_UPDATED, chatId, ChatRole.MODERATOR)
            );

            role = ChatRole.ADMIN;
            eventType = SystemEventType.OWNERSHIP_TRANSFERRED;
        }
        else if (data.role() == ChatRole.MODERATOR) {
            role = ChatRole.MODERATOR;
            eventType = SystemEventType.MEMBER_PROMOTED;
        }
        else {
            role = ChatRole.MEMBER;
            eventType = SystemEventType.MEMBER_DEMOTED;
        }

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFound("Chat not found"));

        List<User> users = userService.getUsersByIds(
                new HashSet<>(List.of(currentUserId, data.userId()))
        );

        Map<String, User> usersMap = users.stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        broadcastSystemMessage(chat,
                SystemMessageContent.of(eventType, usersMap.get(data.userId()).getUsername(), usersMap.get(currentUserId).getUsername())
        );

        websocketBroadcaster.broadcastEvent(
                List.of(otherUser.getUserId()),
                ChatEvent.of(ChatEventType.MEMBER_ROLE_UPDATED, chatId, role)
        );
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

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFound("Chat not found"));

        List<User> users = userService.getUsersByIds(
                new HashSet<>(List.of(currentUserId, memberId))
        );

        Map<String, User> usersMap = users.stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        broadcastSystemMessage(chat,
                SystemMessageContent.of(SystemEventType.MEMBER_KICKED, usersMap.get(memberId).getUsername(), usersMap.get(currentUserId).getUsername())
        );

        websocketBroadcaster.broadcastEvent(
                List.of(otherUser.getUserId()),
                ChatEvent.of(ChatEventType.MEMBER_KICKED, chatId)
        );
    }

    public void addMembers(String chatId, String currentUserId, List<String> memberIds) {
        boolean isMember = chatMemberRepository.findByChatIdAndUserId(chatId, currentUserId).isPresent();

        if (!isMember) {
            throw new ForbiddenException("Current user doesn't belong to this chat");
        }

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFound("Chat not found"));

        String chatLastMessageId = chat.getLastMessageId();
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
        membersToReactivate.forEach(m -> {
                m.setActive(true);
                m.setLastReadMessageId(chatLastMessageId);
        });
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
                                .lastReadMessageId(chatLastMessageId)
                                .build()
                )
                .toList();

        chatMemberRepository.saveAll(newChatMembers);

        Set<String> allAddedIds = new HashSet<>();
        allAddedIds.addAll(reactivatedIds);
        allAddedIds.addAll(finalNewMembers);

        if (!allAddedIds.isEmpty()) {
            List<String> addedNames = userService.getUsersByIds(allAddedIds)
                    .stream()
                    .map(User::getUsername)
                    .toList();

            User actor = userService.getUserById(currentUserId);
            broadcastSystemMessage(chat,
                    SystemMessageContent.of(SystemEventType.MEMBER_ADDED, addedNames, actor.getUsername())
            );

            Message message = messageService.getMessage(chat.getLastMessageId());

            ChatPreview chatPreview = new ChatPreview(
                    chat.getId(),
                    chat.getChatType(),
                    chat.getChatName(),
                    chat.getImageUrl(),
                    message.getId(),
                    message.getContent(),
                    message.getCreatedAt(),
                    message.isDeleted(),
                    ChatRole.MEMBER,
                    false,
                    0,
                    null,
                    null
            );

            websocketBroadcaster.broadcastEvent(
                    new ArrayList<>(allAddedIds),
                    ChatEvent.of(ChatEventType.MEMBER_ADDED, chatId, chatPreview)
            );
        }
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

    public void activateChatMembersByChat(String chatId) {
        List<ChatMember> members = chatMemberRepository
                .findByChatIdAndMutedFalseAndActiveFalse(chatId);

        members.forEach(m -> m.setActive(true));
        chatMemberRepository.saveAll(members);
    }

    private void broadcastSystemMessage(Chat chat, SystemMessageContent content) {
        Message message = messageService.saveSystemMessage(chat.getId(), content);
        chat.setLastMessageId(message.getId());
        chatRepository.save(chat);

        MessageResponse response = MessageResponse.system(message);

        List<String> memberIds = getMemberIds(chat.getId());
        websocketBroadcaster.broadcastMessage(memberIds, response);
    }
}