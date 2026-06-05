package com.pingme.chats;

import com.mongodb.DuplicateKeyException;
import com.pingme.chats.dto.*;
import com.pingme.shared.events.Event;
import com.pingme.shared.events.EventType;
import com.pingme.chats.members.ChatMember;
import com.pingme.chats.members.ChatMemberRepository;
import com.pingme.chats.members.ChatMemberService;
import com.pingme.chats.members.ChatRole;
import com.pingme.contacts.Contact;
import com.pingme.contacts.ContactService;
import com.pingme.contacts.ContactStatus;
import com.pingme.shared.WebsocketBroadcaster;
import com.pingme.shared.cloudinary.CloudinaryService;
import com.pingme.shared.cloudinary.CloudinaryUploadResult;
import com.pingme.shared.exceptions.BadRequestException;
import com.pingme.shared.exceptions.ForbiddenException;
import com.pingme.messages.Message;
import com.pingme.messages.MessageService;
import com.pingme.shared.presence.PresenceTracker;
import com.pingme.users.User;
import com.pingme.users.UserService;
import com.pingme.shared.utils.PagedResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ContactService contactService;
    private final MessageService messageService;
    private final UserService userService;
    private final ChatMemberService chatMemberService;
    private final CloudinaryService cloudinaryService;
    private final WebsocketBroadcaster websocketBroadcaster;
    private final ChatMemberRepository chatMemberRepository;
    private final PresenceTracker presenceTracker;

    public ChatPreview getOrCreatePrivateChat(String userId, String targetId) {
        log.debug("Getting or creating private chat [userId={}, targetId={}]", userId, targetId);

        if (!contactService.existsAcceptedContactBetween(userId, targetId)) {
            log.warn("Private chat attempt with non-contact [userId={}, targetId={}]", userId, targetId);
            throw new ForbiddenException("User is not in your contact list");
        }

        Optional<Chat> existing = chatRepository.findByPrivateChatKey(createPrivateChatKey(userId, targetId));
        boolean existed = existing.isPresent();
        Chat chat = existing.orElseGet(() -> createPrivateChat(userId, targetId));

        if (!existed) {
            log.info("Private chat created [chatId={}, userId={}, targetId={}]", chat.getId(), userId, targetId);
        } else {
            log.debug("Private chat already exists [chatId={}, userId={}, targetId={}]", chat.getId(), userId, targetId);
        }

        ChatMember member = chatMemberService.getChatMember(chat.getId(), userId);
        member = chatMemberService.activateChatMember(member);

        List<ChatMember> members = chatMemberService.getChatMembers(chat.getId());

        String otherUserId = members.stream()
                .map(ChatMember::getUserId)
                .filter(id -> !id.equals(userId))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Private chat must have exactly two members"));

        User otherUser = userService.getUserById(otherUserId);

        String lastMessageId = null;
        String lastMessage = null;
        Instant lastMessageTimestamp = null;
        Boolean lastMessageDeleted = null;
        if (chat.getLastMessageId() != null) {
            Message message = messageService.getMessage(chat.getLastMessageId());
            lastMessageId = message.getId();
            lastMessage = message.getContent();
            lastMessageTimestamp = message.getCreatedAt();
            lastMessageDeleted = message.isDeleted();
        }

        long unreadCount = messageService.getUnreadCount(chat.getId(), member.getLastReadMessageId());

        return new ChatPreview(
                chat.getId(),
                chat.getChatType(),
                otherUser.getDisplayName(),
                otherUser.getAvatarUrl(),
                lastMessageId,
                lastMessage,
                lastMessageTimestamp,
                lastMessageDeleted,
                member.getRole(),
                member.isMuted(),
                (int) unreadCount,
                otherUser.getId(),
                presenceTracker.isUserOnline(otherUser.getId())
                        ? null
                        : otherUser.getLastSeenAt()
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
            log.warn("Unauthorized chat access attempt [userId={}, chatId={}]", userId, chatId);
            throw new ForbiddenException("Current user doesn't belong to this chat");
        }
    }

    @Transactional
    private Chat createPrivateChat(String userId, String targetId) {
        if (userId.equals(targetId)) {
            log.warn("Self-chat attempt [userId={}]", userId);
            throw new BadRequestException("You cannot create a chat with yourself");
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

    @Transactional
    public ChatPreview createGroupChat(String userId, List<String> memberIds, String chatName) {
        log.info("Creating group chat [creatorId={}, memberCount={}, chatName='{}']", userId, memberIds.size(), chatName);

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
            log.warn(
                    "Group chat creation with non-contacts [userId={}, invalidMembers={}]",
                    userId,
                    otherMembers.stream().filter(id -> !contactSet.contains(id)).toList()
            );
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

        log.info(
                "Group chat created [chatId={}, creatorId={}, memberCount={}]",
                chat.getId(),
                userId,
                members.size()
        );

        ChatPreview adminPreview = null;
        for (ChatMember member : chatMembers) {
            ChatPreview chatPreview = new ChatPreview(
                    chat.getId(),
                    chat.getChatType(),
                    chat.getChatName(),
                    chat.getImageUrl(),
                    null,
                    null,
                    null,
                    null,
                    member.getRole(),
                    false,
                    0,
                    null,
                    null
            );

            if (member.getRole() == ChatRole.ADMIN) {
                adminPreview = chatPreview;
            }

            websocketBroadcaster.broadcastEvent(
                    List.of(member.getUserId()),
                    Event.of(EventType.CHAT_CREATED, chat.getId(), chatPreview)
            );
        }

        return adminPreview;
    }

    private Chat createChat(Chat chat) {

        if (chat.getChatType() == ChatType.PRIVATE) {
            if (chat.getPrivateChatKey() == null || chat.getPrivateChatKey().isBlank()) {
                log.error("Attempted to create PRIVATE chat without privateChatKey");
                throw new IllegalArgumentException("PRIVATE chat must have privateChatKey");
            }
        }
        else if (chat.getChatType() == ChatType.GROUP) {
            if (chat.getPrivateChatKey() != null) {
                log.error("Attempted to create GROUP chat with privateChatKey");
                throw new IllegalArgumentException("GROUP chat cannot have privateChatKey");
            }
        }

        try {
            Chat saved = chatRepository.save(chat);
            log.debug("Chat persisted [chatId={}, type={}]", saved.getId(), saved.getChatType());
            return saved;
        } catch (DuplicateKeyException e) {
            log.warn("Duplicate key on chat creation, fetching existing [privateChatKey={}]", chat.getPrivateChatKey());
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

    @Transactional
    public void deleteChat(String userId, String chatId) {
        log.info("Deleting chat [userId={}, chatId={}]", userId, chatId);
        ChatMember currentUser = chatMemberService.getChatMember(chatId, userId);

        if(currentUser.getRole() != ChatRole.ADMIN) {
            log.warn("Non-admin attempted chat deletion [userId={}, chatId={}]", userId, chatId);
            throw new ForbiddenException("You don't have enough permissions for this action");
        }

        Chat chat = getChat(chatId, userId);
        List<ChatMember> members = chatMemberService.getChatMembers(chatId);
        chatMemberService.deleteAll(members);

        List<Message> messages = messageService.getMessagesByChatId(chatId);
        messageService.deleteAll(messages);

        chatRepository.delete(chat);
        log.info("Chat deleted [chatId={}, type={}, memberCount={}]", chatId, chat.getChatType(), members.size());

        websocketBroadcaster.broadcastEvent(
                members.stream().map(ChatMember::getUserId).toList(),
                Event.of(EventType.CHAT_DELETED, chat.getId())
        );
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
                .map(context -> {
                    boolean online = context.otherUser() != null && presenceTracker.isUserOnline(context.otherUser().getId());
                    return context.toPreview(online);
                })
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

        long unreadCount = member.isMuted() ? 0 :  messageService.getUnreadCount(chat.getId(), member.getLastReadMessageId());

        return new ChatContext(
                chat,
                member,
                otherUser,
                lastMessage,
                sortTime,
                (int) unreadCount
        );
    }

    public ChatPreview getChatPreviewById(String userId, String chatId) {
        Chat chat = getChat(chatId, userId);
        return getChatPreviewById(chat, userId);
    }

    public ChatPreview getChatPreviewById(Chat chat, String userId) {
        ChatMember member = chatMemberService.getChatMember(chat.getId(), userId);

        User otherUser = null;
        if (chat.getChatType() == ChatType.PRIVATE) {
            String otherUserId = getOtherUserId(chat, userId);
            otherUser = userService.getUserById(otherUserId);
        }

        String lastMessageId = null;
        String lastMessage = null;
        Instant lastMessageTimestamp = null;
        Boolean lastMessageDeleted = null;
        if (chat.getLastMessageId() != null) {
            Message message = messageService.getMessage(chat.getLastMessageId());
            lastMessageId = message.getId();
            lastMessage = message.getContent();
            lastMessageTimestamp = message.getCreatedAt();
            lastMessageDeleted = message.isDeleted();
        }

        long unreadCount = messageService.getUnreadCount(chat.getId(), member.getLastReadMessageId());

        String chatName = chat.getChatName();
        String chatImage = chat.getImageUrl();
        String otherUserId = null;
        Instant otherUserLastSeenAt = null;

        if(chat.getChatType() == ChatType.PRIVATE && otherUser != null) {
            chatName = otherUser.getDisplayName();
            chatImage = otherUser.getAvatarUrl();
            otherUserId = otherUser.getId();
            if(!presenceTracker.isUserOnline(otherUserId)) {
                otherUserLastSeenAt = otherUser.getLastSeenAt();
            }
        }


        return new ChatPreview(
                chat.getId(),
                chat.getChatType(),
                chatName,
                chatImage,
                lastMessageId,
                lastMessage,
                lastMessageTimestamp,
                lastMessageDeleted,
                member.getRole(),
                member.isMuted(),
                (int) unreadCount,
                otherUserId,
                otherUserLastSeenAt
        );
    }

    public ChatPreview updateChat(String userId, String chatId, UpdateChatRequest request, MultipartFile file) throws IOException {
        log.info(
                "Updating chat [userId={}, chatId={}, hasNameChange={}, hasImage={}]",
                userId, chatId,
                request != null && request.chatName() != null,
                file != null && !file.isEmpty()
        );

        ChatMember currentUser = chatMemberService.getChatMember(chatId, userId);

        if(currentUser.getRole() != ChatRole.ADMIN) {
            log.warn("Non-admin attempted chat update [userId={}, chatId={}]", userId, chatId);
            throw new ForbiddenException("You don't have enough permissions");
        }

        Chat chat = getChat(chatId, userId);

        if (request != null && request.chatName() != null) {
            log.debug(
                    "Updating chat name [chatId={}, oldName='{}', newName='{}']",
                    chatId,
                    chat.getChatName(),
                    request.chatName()
            );
            chat.setChatName(request.chatName());
        }

        if (file != null && !file.isEmpty()) {

            if (chat.getImagePublicId() != null) {
                log.debug("Deleting old chat image [chatId={}, publicId={}]", chatId, chat.getImagePublicId());
                cloudinaryService.deleteImage(chat.getImagePublicId());
            }

            CloudinaryUploadResult result = cloudinaryService.uploadProfilePicture(file);
            chat.setImageUrl(result.secureUrl());
            chat.setImagePublicId(result.publicId());
            log.debug("Chat image uploaded [chatId={}, publicId={}]", chatId, result.publicId());
        }

        Chat saved = chatRepository.save(chat);
        log.info("Chat updated [chatId={}]", chatId);
        websocketBroadcaster.broadcastEvent(
                getChatMembersIds(saved),
                Event.of(EventType.DETAILS_UPDATED, saved.getId(), new UpdateChatResponse(saved.getChatName(), saved.getImageUrl()))
        );

        return getChatPreviewById(saved, userId);
    }

    private List<String> getChatMembersIds(Chat chat) {
        return getChatMembers(chat).stream()
                .map(ChatMember::getUserId)
                .toList();
    }

    private List<ChatMember> getChatMembers(Chat chat) {
        if(chat.getChatType() == ChatType.PRIVATE) {
            return chatMemberRepository.findByChatId(chat.getId());
        }

        return chatMemberRepository.findByChatIdAndActiveTrue(chat.getId());
    }
}