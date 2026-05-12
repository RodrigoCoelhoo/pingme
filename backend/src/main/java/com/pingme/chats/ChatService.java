package com.pingme.chats;

import com.mongodb.DuplicateKeyException;
import com.pingme.chats.dto.ChatContext;
import com.pingme.chats.dto.ChatMemberResponse;
import com.pingme.chats.dto.ChatPreview;
import com.pingme.chats.members.ChatMember;
import com.pingme.chats.members.ChatMemberService;
import com.pingme.chats.members.ChatRole;
import com.pingme.contacts.Contact;
import com.pingme.contacts.ContactService;
import com.pingme.contacts.ContactStatus;
import com.pingme.exceptions.BadRequestException;
import com.pingme.exceptions.ForbiddenException;
import com.pingme.messages.Message;
import com.pingme.messages.MessageService;
import com.pingme.users.User;
import com.pingme.users.UserService;
import com.pingme.utils.PagedResponse;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ContactService contactService;
    private final MessageService messageService;
    private final UserService userService;
    private final ChatMemberService chatMemberService;

    public ChatPreview getOrCreatePrivateChat(String userId, String targetId) {
        Chat chat = chatRepository.findByPrivateChatKey(createPrivateChatKey(userId, targetId))
                .orElseGet(() -> createPrivateChat(userId, targetId));

        ChatMember member = chatMemberService.getChatMember(chat.getId(), userId);
        member = chatMemberService.activateChatMember(member);

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

        String privateChatKey = createPrivateChatKey(userId, targetId);

        Chat chat = createChat(
                Chat.builder()
                    .chatType(ChatType.PRIVATE)
                    .privateChatKey(privateChatKey)
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

    private String createPrivateChatKey(String user1, String user2) {
        return Stream.of(user1, user2)
                .sorted()
                .collect(Collectors.joining("_"));
    }

    public ChatPreview createGroupChat(String userId, List<String> memberIds, String chatName) {

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

        Chat chat = createChat(
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

        return new ChatPreview(
                chat.getId(),
                chat.getChatType(),
                chat.getChatName(),
                chat.getImageUrl(),
                "",
                null,
                ChatRole.ADMIN,
                false,
                0
        );
    }

    private Chat createChat(Chat chat) {

        if (chat.getChatType() == ChatType.PRIVATE) {
            if (chat.getPrivateChatKey() == null || chat.getPrivateChatKey().isBlank()) {
                throw new IllegalArgumentException("PRIVATE chat must have privateChatKey");
            }
        }
        else if (chat.getChatType() == ChatType.GROUP) {
            if (chat.getPrivateChatKey() != null) {
                throw new IllegalArgumentException("GROUP chat cannot have privateChatKey");
            }
        }

        try {
            return chatRepository.save(chat);
        } catch (DuplicateKeyException e) {
            return chatRepository.findByPrivateChatKey(chat.getPrivateChatKey())
                    .orElseThrow(() -> new IllegalStateException(
                            "Duplicate key conflict but chat was not found"
                    ));
        }
    }

    public PagedResponse<ChatMemberResponse> getChatMembers(
            String userId,
            String chatId,
            int page,
            int size,
            String search
    ) {
        validateChatAccess(chatId, userId);

        List<ChatMember> members = chatMemberService.getChatMembers(chatId, page, size, search);
        long totalMembers = chatMemberService.getTotalMembers(chatId, search);

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

        return new PagedResponse<>(
                memberResponses,
                page,
                size,
                totalMembers,
                (int) Math.ceil((double) totalMembers / size),
                (long) (page + 1) * size < totalMembers
        );
    }

    public void deleteChat(String userId, String chatId) {
        ChatMember currentUser = chatMemberService.getChatMember(chatId, userId);

        if(currentUser.getRole() != ChatRole.ADMIN) {
            throw new ForbiddenException("You don't have enough permissions for this action");
        }

        Chat chat = getChat(chatId, userId);
        List<ChatMember> members = chatMemberService.getChatMembers(chatId);
        chatMemberService.deleteAll(members);
        chatRepository.delete(chat);
    }

    public PagedResponse<ChatPreview> getUserChats(
            String userId,
            int page,
            int size,
            String search
    ) {
        List<ChatMember> memberships = chatMemberService.getUserChats(userId);
        if (memberships.isEmpty()) {
            return emptyPagedResponse(page, size);
        }

        Map<String, ChatMember> memberByChatId = memberships.stream()
                .collect(Collectors.toMap(
                        ChatMember::getChatId,
                        m -> m,
                        (a, b) -> a
                ));

        List<String> chatIds = memberships.stream()
                .map(ChatMember::getChatId)
                .toList();

        List<Chat> chats = chatRepository.findAllById(chatIds);
        if (chats.isEmpty()) {
            return emptyPagedResponse(page, size);
        }

        Map<String, User> otherUserByChatId = getOtherUsersMap(chats, userId);
        Map<String, Message> lastMessageById = getLastMessageMap(chats);

        List<ChatContext> contexts = chats.stream()
                .map(chat -> buildContext(
                        chat,
                        memberByChatId,
                        otherUserByChatId,
                        lastMessageById
                ))
                .filter(ctx -> filterBySearch(ctx, search))
                .sorted(Comparator.comparing(ChatContext::sortTime).reversed())
                .toList();

        int totalElements = contexts.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);

        int fromIndex = page * size;
        if (fromIndex >= totalElements) {
            return emptyPagedResponse(page, size);
        }

        int toIndex = Math.min(fromIndex + size, totalElements);
        List<ChatContext> pageItems = contexts.subList(fromIndex, toIndex);

        List<ChatPreview> previews = pageItems.stream()
                .map(ChatContext::toPreview)
                .toList();

        return new PagedResponse<>(
                previews,
                page,
                size,
                totalElements,
                totalPages,
                page < totalPages - 1
        );
    }

    private PagedResponse<ChatPreview> emptyPagedResponse(int page, int size) {
        return new PagedResponse<>(List.of(), page, size, 0, 0, false);
    }

    private Map<String, User> getOtherUsersMap(
            List<Chat> chats,
            String userId
    ) {
        List<Chat> privateChats = chats.stream()
                .filter(c -> c.getChatType() == ChatType.PRIVATE)
                .toList();

        Set<String> otherUserIds = privateChats.stream()
                .map(chat -> getOtherUserId(chat, userId))
                .collect(Collectors.toSet());

        Map<String, User> userById = userService.getUsersByIds(otherUserIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return privateChats.stream()
                .collect(Collectors.toMap(
                        Chat::getId,
                        chat -> userById.get(getOtherUserId(chat, userId))
                ));
    }

    private String getOtherUserId(Chat chat, String userId) {
        String[] parts = chat.getPrivateChatKey().split("_");
        return parts[0].equals(userId) ? parts[1] : parts[0];
    }

    private boolean filterBySearch(ChatContext ctx, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }

        String q = search.toLowerCase().trim();
        Chat chat = ctx.chat();

        if (chat.getChatType() == ChatType.GROUP) {
            return chat.getChatName() != null &&
                    chat.getChatName().toLowerCase().contains(q);
        }

        User other = ctx.otherUser();
        return other != null &&
                other.getDisplayName() != null &&
                other.getDisplayName().toLowerCase().contains(q);
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

    private ChatContext buildContext(
            Chat chat,
            Map<String, ChatMember> memberByChatId,
            Map<String, User> otherUserByChatId,
            Map<String, Message> lastMessageById
    ) {
        ChatMember member = memberByChatId.get(chat.getId());

        User otherUser = chat.getChatType() == ChatType.PRIVATE
                ? otherUserByChatId.get(chat.getId())
                : null;

        Message lastMessage = null;

        if (chat.getLastMessageId() != null) {
            lastMessage = lastMessageById.get(chat.getLastMessageId());
        }

        Instant sortTime = lastMessage != null
                ? lastMessage.getCreatedAt()
                : chat.getCreatedAt();

        return new ChatContext(
                chat,
                member,
                otherUser,
                lastMessage,
                sortTime
        );
    }
}