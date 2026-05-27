package com.pingme.messages;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pingme.chats.Chat;
import com.pingme.chats.ChatRepository;
import com.pingme.chats.ChatType;
import com.pingme.chats.members.ChatMember;
import com.pingme.chats.members.ChatMemberRepository;
import com.pingme.messages.dto.MessageResponse;
import com.pingme.shared.WebsocketBroadcaster;
import com.pingme.shared.cloudinary.CloudinaryService;
import com.pingme.shared.cloudinary.CloudinaryUploadResult;
import com.pingme.shared.exceptions.BadRequestException;
import com.pingme.shared.exceptions.ForbiddenException;
import com.pingme.shared.exceptions.ResourceNotFound;
import com.pingme.messages.system.SystemMessageContent;
import com.pingme.users.User;
import com.pingme.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final ChatRepository chatRepository;
    private final ObjectMapper objectMapper;
    private final CloudinaryService cloudinaryService;
    private final UserService userService;
    private final WebsocketBroadcaster websocketBroadcaster;

    public Message getMessage(String messageId) {
        return messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFound("Message not found"));
    }

    public List<Message> getMessagesByIds(List<String> ids) {
        return messageRepository.findByIdIn(ids);
    }

    public Message saveMessage(String chatId, String senderId, String content, MessageType type) {
        Chat chat = getChat(chatId, senderId);

        Message message = Message.builder()
                .chatId(chatId)
                .senderId(senderId)
                .content(content)
                .type(type)
                .createdAt(Instant.now())
                .deleted(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        chat.setLastMessageId(savedMessage.getId());
        chatRepository.save(chat);

        return savedMessage;
    }

    public Page<Message> getMessagesByChatId(String chatId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return messageRepository.findByChatId(chatId, pageable);
    }

    public List<Message> getMessagesByChatId(String chatId) {
        return messageRepository.findByChatId(chatId);
    }

    public Message editMessage(String messageId, String currentUserId, String newContent) {
        Message message = getMessage(messageId);

        if(!message.getSenderId().equals(currentUserId)) {
            throw new ForbiddenException("Cannot edit messages of other users");
        }

        if (message.isDeleted()) {
            throw new BadRequestException("Cannot edit a deleted message");
        }

        if(message.getType() != MessageType.TEXT) {
            throw new BadRequestException("Only text messages can be edited");
        }

        if(newContent.trim().isEmpty()) {
            throw new BadRequestException("Message content can't be null");
        }

        message.setContent(newContent.trim());
        message.setEditedAt(Instant.now());

        return messageRepository.save(message);
    }

    public Message deleteMessage(String chatId, String messageId, String currentUserId) {
        Message message = getMessage(messageId);

        if (message.isDeleted()) {
            throw new BadRequestException("Message is already deleted");
        }

        List<ChatMember> members = chatMemberRepository.findAllByChatIdAndUserIdIn(chatId, List.of(message.getSenderId(), currentUserId));
        if(members.size() != 2) {
            throw new ForbiddenException("Both users must be members of the chat");
        }

        ChatMember currentUserMembership = members.get(0).getUserId().equals(currentUserId) ? members.get(0) : members.get(1);
        ChatMember otherUserMembership = members.get(0).getUserId().equals(message.getSenderId()) ? members.get(0) : members.get(1);

        boolean isOwnMessage = message.getSenderId().equals(currentUserId);
        if (!isOwnMessage && currentUserMembership.getRole().compareTo(otherUserMembership.getRole()) >= 0) {
            throw new ForbiddenException("You don't have permission to delete this message");
        }

        try {
            if (message.getType() == MessageType.IMAGE) {
                cloudinaryService.deleteImage(message.getMediaPublicId());
            }
            else if(message.getType() == MessageType.FILE) {
                cloudinaryService.deleteFile(message.getMediaPublicId());
            }
        } catch (IOException exception) {
            //
        }

        message.setDeleted(true);
        message.setContent("");

        return messageRepository.save(message);
    }

    public long getUnreadCount(String chatId, String lastReadMessageId) {
        if (lastReadMessageId == null || lastReadMessageId.isEmpty()) {
            return messageRepository.findByChatIdAndDeletedFalse(chatId, Pageable.unpaged())
                    .getTotalElements();
        }

        return messageRepository.countUnreadMessages(chatId, lastReadMessageId);
    }

    public Message saveSystemMessage(String chatId, SystemMessageContent content) {
        try {
            String json = objectMapper.writeValueAsString(content);

            Message message = Message.builder()
                    .chatId(chatId)
                    .senderId(null)
                    .content(json)
                    .type(MessageType.SYSTEM)
                    .createdAt(Instant.now())
                    .build();

            return messageRepository.save(message);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize system message", e);
        }
    }

    public void deleteAll(List<Message> messages) {
        messageRepository.deleteAll(messages);
    }

    public List<MessageResponse> sendFileMessages(String chatId, String userId, List<MultipartFile> files) {
        Chat chat = getChat(chatId, userId);
        User user = userService.getUserById(userId);

        String folder = "chats/" + chatId;
        List<Message> messagesToSave = new ArrayList<>();
        for (MultipartFile file : files) {
            MessageType type = file.getContentType() != null &&
                    file.getContentType().startsWith("image/")
                    ? MessageType.IMAGE
                    : MessageType.FILE;

            try {
                CloudinaryUploadResult upload = type == MessageType.IMAGE
                        ? cloudinaryService.uploadImage(file, folder)
                        : cloudinaryService.uploadFile(file, folder);

                Message message = Message.builder()
                        .chatId(chatId)
                        .senderId(userId)
                        .content(upload.secureUrl())
                        .mediaPublicId(upload.publicId())
                        .type(type)
                        .createdAt(Instant.now())
                        .build();

                messagesToSave.add(message);
            } catch (IOException e) {
                // Loga e continua — não falha o batch por um ficheiro
            }
        }

        List<Message> savedMessages = messageRepository.saveAll(messagesToSave);
        chat.setLastMessageId(savedMessages.getLast().getId());
        chatRepository.save(chat);

        List<MessageResponse> responses = savedMessages.stream().map(m -> MessageResponse.from(m, user)).toList();

        List<String> membersIds = getChatMembersIds(chat);
        responses.forEach(response -> websocketBroadcaster.broadcastMessage(membersIds, response));

        return responses;
    }

    private Chat getChat(String chatId, String userId) {
        boolean isMember = chatMemberRepository.findByChatIdAndUserId(chatId, userId).isPresent();

        if (!isMember) {
            throw new ForbiddenException("Current user doesn't belong to this chat");
        }

        return chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFound("Chat not found"));
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