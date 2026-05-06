package com.pingme.chats;

import com.pingme.chats.dto.ChatMemberResponse;
import com.pingme.chats.dto.ChatMembers;
import com.pingme.chats.dto.ChatPreview;
import com.pingme.chats.members.ChatMember;
import com.pingme.chats.members.ChatMemberService;
import com.pingme.chats.members.ChatRole;
import com.pingme.contacts.Contact;
import com.pingme.contacts.ContactService;
import com.pingme.contacts.ContactStatus;
import com.pingme.exceptions.BadRequestException;
import com.pingme.exceptions.ForbiddenException;
import com.pingme.exceptions.ResourceNotFound;
import com.pingme.messages.Message;
import com.pingme.messages.MessageService;
import com.pingme.users.User;
import com.pingme.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ContactService contactService;
    private final MessageService messageService;
    private final UserService userService;
    private final ChatMemberService chatMemberService;

    public ChatPreview getOrCreatePrivateChat(String userId, String targetId) {
        Chat chat = chatMemberService.findPrivateChat(
                userId,
                targetId
        ).orElseGet(() -> createPrivateChat(userId, targetId));

        ChatMember member = chatMemberService.getChatMember(chat.getId(), userId);
        chatMemberService.activateChat(member);

        List<ChatMember> members = chatMemberService.getChatMembers(chat.getId());

        String otherUserId = members.stream()
                .map(ChatMember::getUserId)
                .filter(id -> !id.equals(userId))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Private chat must have exactly two members"));

        User otherUser = userService.getUserById(otherUserId);

        String lastMessage = null;
        Instant lastMessageTimestamp = null;
        if (chat.getLastMessageId() != null) {
            Message message = messageService.getMessage(chat.getLastMessageId());
            lastMessage = message.getContent();
            lastMessageTimestamp = message.getCreatedAt();
        }

        return new ChatPreview(
                chat.getId(),
                chat.getChatType(),
                otherUser.getDisplayName(),
                otherUser.getAvatarUrl(),
                lastMessage,
                lastMessageTimestamp,
                member.getRole(),
                member.isMuted(),
                0
        );
    }

    public Chat getChat(String chatId, String userId) {
        validateChatAccess(chatId, userId);

        return chatRepository.findById(chatId)
                .orElseThrow(() -> new BadRequestException("Chat not found"));
    }

    private void validateChatAccess(String chatId, String userId) {
        boolean isMember = chatMemberService.exists(chatId, userId);

        if (!isMember) {
            throw new ForbiddenException("Current user doesn't belong to this chat");
        }
    }

    private Chat createPrivateChat(String userId, String targetId) {

        if (userId.equals(targetId)) {
            throw new BadRequestException("You cannot create a chat with yourself");
        }

        if (!contactService.existsAcceptedContactBetween(userId, targetId)) {
            throw new ForbiddenException("User is not in your contact list");
        }

        Chat chat = chatRepository.save(
                Chat.builder()
                    .chatType(ChatType.PRIVATE)
                    .build()
        );

        chatMemberService.saveAll(List.of(
                ChatMember.builder()
                        .chatId(chat.getId())
                        .userId(userId)
                        .active(true)
                        .muted(false)
                        .role(ChatRole.MEMBER)
                        .build(),

                ChatMember.builder()
                        .chatId(chat.getId())
                        .userId(targetId)
                        .active(false)
                        .muted(false)
                        .role(ChatRole.MEMBER)
                        .build()
        ));

        return chat;
    }

    public Chat createGroupChat(String userId, List<String> memberIds, String chatName) {

        List<String> members = new ArrayList<>(memberIds);

        if (!members.contains(userId)) {
            members.add(userId);
        }

        List<String> otherMembers = members.stream()
                .filter(id -> !id.equals(userId))
                .toList();

        Set<String> contactSet = new HashSet<>(contactService.getAcceptedContactIds(userId));

        boolean allValid = contactSet.containsAll(otherMembers);

        if (!allValid) {
            throw new ForbiddenException("Some users are not in your contact list");
        }

        Chat chat = chatRepository.save(
                Chat.builder()
                        .chatType(ChatType.GROUP)
                        .chatName(chatName)
                        .imageUrl("")
                        .build()
        );

        List<ChatMember> chatMembers = members.stream()
                .map(id -> ChatMember.builder()
                        .chatId(chat.getId())
                        .userId(id)
                        .active(true)
                        .muted(false)
                        .role(id.equals(userId) ? ChatRole.ADMIN : ChatRole.MEMBER)
                        .build()
                )
                .toList();

        chatMemberService.saveAll(chatMembers);

        return chat;
    }

    public List<ChatPreview> getUserChats(String userId) {
        List<ChatMember> memberships = chatMemberService.getUserChats(userId);
        if (memberships.isEmpty()) return List.of();

        Map<String, ChatMember> memberMap = mapMemberships(memberships);
        List<String> chatIds = extractChatIds(memberships);

        List<Chat> chats = chatRepository.findAllById(chatIds);
        if (chats.isEmpty()) return List.of();

        Map<String, Message> lastMessageMap = getLastMessageMap(chats);

        List<String> privateChats = chats.stream()
                .filter(c -> c.getChatType() == ChatType.PRIVATE)
                .map(Chat::getId)
                .toList();

        Map<String, String> otherUserByChat = getOtherUserMap(privateChats, userId);

        return chats.stream()
                .map(chat -> buildChatPreview(chat, memberMap, lastMessageMap, otherUserByChat))
                .toList();
    }

    private Map<String, ChatMember> mapMemberships(List<ChatMember> memberships) {
        return memberships.stream()
                .collect(Collectors.toMap(
                        ChatMember::getChatId,
                        m -> m
                ));
    }

    private List<String> extractChatIds(List<ChatMember> memberships) {
        return memberships.stream()
                .map(ChatMember::getChatId)
                .toList();
    }

    private Map<String, Message> getLastMessageMap(List<Chat> chats) {
        List<String> lastMessageIds = chats.stream()
                .map(Chat::getLastMessageId)
                .filter(Objects::nonNull)
                .toList();

        if (lastMessageIds.isEmpty()) return Map.of();

        return messageService.getMessagesByIds(lastMessageIds).stream()
                .collect(Collectors.toMap(Message::getId, m -> m));
    }

    private Map<String, String> getOtherUserMap(List<String> chatIds, String userId) {

        List<ChatMember> otherMembers = chatMemberService.getOtherMembers(chatIds, userId);

        return otherMembers.stream()
                .collect(Collectors.toMap(
                        ChatMember::getChatId,
                        ChatMember::getUserId
                ));
    }

    private ChatPreview buildChatPreview(
            Chat chat,
            Map<String, ChatMember> memberMap,
            Map<String, Message> lastMessageMap,
            Map<String, String> otherUserByChat
    ) {

        ChatMember member = memberMap.get(chat.getId());

        String lastMessage = null;
        Instant lastMessageTimestamp = null;

        if (chat.getLastMessageId() != null) {
            Message message = lastMessageMap.get(chat.getLastMessageId());
            if (message != null) {
                lastMessage = message.getContent();
                lastMessageTimestamp = message.getCreatedAt();
            }
        }

        String chatName;
        String chatImageUrl;

        if (chat.getChatType() == ChatType.PRIVATE) {

            String otherUserId = otherUserByChat.get(chat.getId());
            User otherUser = userService.getUserById(otherUserId);

            chatName = otherUser.getDisplayName();
            chatImageUrl = otherUser.getAvatarUrl();
        } else {
            chatName = chat.getChatName();
            chatImageUrl = chat.getImageUrl();
        }

        return new ChatPreview(
                chat.getId(),
                chat.getChatType(),
                chatName,
                chatImageUrl,
                lastMessage,
                lastMessageTimestamp,
                member.getRole(),
                member.isMuted(),
                0
        );
    }

    public ChatMembers getChatMembers(String userId, String chatId, int page, int size) {
        validateChatAccess(chatId, userId);

        List<ChatMember> members = chatMemberService.getChatMembers(chatId, page, size);
        long totalMembers = chatMemberService.getTotalMembers(chatId);

        Set<String> memberIds = members.stream()
                .map(ChatMember::getUserId)
                .collect(Collectors.toSet());

        List<User> users = userService.getUsersByIds(memberIds);
        Map<String, User> userMap = users.stream()
                .collect(Collectors.toMap(
                        User::getId,
                        Function.identity() // Use the instance itself as the value
                ));

        List<Contact> contacts = contactService.getContactsBetween(userId, memberIds);
        Map<String, ContactStatus> statusMap = contacts.stream()
                .collect(Collectors.toMap(
                        contact -> contact.getSenderId().equals(userId)
                                ? contact.getReceiverId()
                                : contact.getSenderId(),
                        Contact::getStatus
                ));

        List<ChatMemberResponse> memberResponses = members.stream()
                .map(member -> {
                    String memberId = member.getUserId();
                    return ChatMemberResponse.format(member, userMap.get(memberId), statusMap.get(memberId));
                })
                .toList();

        return new ChatMembers(memberResponses, totalMembers);
    }
}