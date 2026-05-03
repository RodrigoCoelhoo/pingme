package com.pingme.chats;

import com.pingme.chats.dto.ChatPreview;
import com.pingme.chats.dto.LastMessageDTO;
import com.pingme.chats.members.ChatMember;
import com.pingme.chats.members.ChatMemberRepository;
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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final ContactService contactService;
    private final MessageService messageService;
    private final UserService userService;

    public ChatPreview getOrCreatePrivateChat(String userId, String targetId) {
        Chat chat = chatRepository.findPrivateChat(
                ChatType.PRIVATE,
                userId,
                targetId
        ).orElseGet(() -> createPrivateChat(userId, targetId));

        String otherUserId = chat.getMemberIds().stream()
                .filter(id -> !id.equals(userId))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Private chat must have exactly two members"));

        User otherUser = userService.getUserById(otherUserId);

        LastMessageDTO lastMessageDTO = null;
        if (chat.getLastMessageId() != null) {
            Message lastMessage = messageService.getMessage(chat.getLastMessageId());
            User sender = lastMessage.getSenderId().equals(otherUserId) ?
                    otherUser :
                    userService.getUserById(lastMessage.getSenderId());

            lastMessageDTO = new LastMessageDTO(
                    sender.getDisplayName(),
                    lastMessage.getContent()
            );
        }

        return new ChatPreview(
                chat.getId(),
                chat.getChatType(),
                otherUser.getDisplayName(),
                otherUser.getAvatarUrl(),
                lastMessageDTO,
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

        chatMemberRepository.saveAll(List.of(
                ChatMember.builder()
                        .chatId(chat.getId())
                        .userId(userId)
                        .active(true)
                        .role(ChatRole.MEMBER)
                        .build(),

                ChatMember.builder()
                        .chatId(chat.getId())
                        .userId(targetId)
                        .active(false)
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
                        .role(id.equals(userId) ? ChatRole.ADMIN : ChatRole.MEMBER)
                        .build()
                )
                .toList();

        chatMemberRepository.saveAll(chatMembers);

        return chat;
    }

    public List<ChatPreview> getUserChats(String userId) {
        List<ChatMember> memberships = chatMemberRepository.findByUserIdAndActiveTrue(userId);
        if (memberships.isEmpty()) return List.of();

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


        Set<String> senderIds = lastMessages.stream()
                .map(Message::getSenderId)
                .collect(Collectors.toSet());
        List<User> senders = userService.getUsersByIds(senderIds);

        Map<String, User> senderMap = senders.stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return chats.stream()
                .map(chat -> {
                    LastMessageDTO lastMessageDTO = null;

                    if (chat.getLastMessageId() != null) {
                        Message lastMessage = lastMessageMap.get(chat.getLastMessageId());
                        if (lastMessage != null) {
                            User sender = senderMap.get(lastMessage.getSenderId());

                            lastMessageDTO = new LastMessageDTO(
                                    sender != null ? sender.getDisplayName() : "Unknown",
                                    lastMessage.getContent()
                            );
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
                            lastMessageDTO,
                            0 // TODO: unread count
                    );
                })
                .toList();
    }
}