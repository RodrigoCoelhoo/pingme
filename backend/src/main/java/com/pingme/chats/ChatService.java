package com.pingme.chats;

import com.pingme.chats.dto.ChatPreview;
import com.pingme.chats.members.ChatMember;
import com.pingme.chats.members.ChatMemberService;
import com.pingme.chats.members.ChatRole;
import com.pingme.contacts.ContactService;
import com.pingme.exceptions.BadRequestException;
import com.pingme.exceptions.ForbiddenException;
import com.pingme.messages.Message;
import com.pingme.messages.MessageService;
import com.pingme.users.User;
import com.pingme.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
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
        Chat chat = chatRepository.findPrivateChat(
                ChatType.PRIVATE,
                userId,
                targetId
        ).orElseGet(() -> createPrivateChat(userId, targetId));

        ChatMember member = chatMemberService.getChatMember(chat.getId(), userId);
        chatMemberService.activateChat(member);


        String otherUserId = chat.getMemberIds().stream()
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
        return chatRepository.findByIdAndMemberIdsContains(chatId, userId)
                .orElseThrow(() -> new ForbiddenException("Current user doesn't belong to this chat"));
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
                    .memberIds(List.of(userId, targetId))
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
                        .memberIds(members)
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

        Map<String, ChatMember> memberMap = memberships.stream()
                .collect(Collectors.toMap(
                        ChatMember::getChatId,
                        m -> m
                ));

        List<String> chatIds = memberships.stream()
                .map(ChatMember::getChatId)
                .toList();

        List<Chat> chats = chatRepository.findAllById(chatIds);
        if (chats.isEmpty()) return List.of();


        List<String> lastMessageIds = chats.stream()
                .map(Chat::getLastMessageId)
                .filter(Objects::nonNull)
                .toList();
        List<Message> lastMessages = messageService.getMessagesByIds(lastMessageIds);

        Map<String, Message> lastMessageMap = lastMessages.stream()
                .collect(Collectors.toMap(Message::getId, m -> m));

        return chats.stream()
                .map(chat -> {
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
                        String otherUserId = chat.getMemberIds().stream()
                                .filter(id -> !id.equals(userId))
                                .findFirst()
                                .orElseThrow(() -> new BadRequestException("Private chat must have exactly two members"));

                        User otherUser = userService.getUserById(otherUserId);
                        chatName = otherUser.getDisplayName();
                        chatImageUrl = otherUser.getAvatarUrl();
                    }
                    else {
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
                            0 // TODO: unread count
                    );
                })
                .toList();
    }
}