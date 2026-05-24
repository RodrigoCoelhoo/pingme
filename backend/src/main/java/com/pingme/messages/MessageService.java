package com.pingme.messages;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pingme.chats.Chat;
import com.pingme.chats.ChatRepository;
import com.pingme.chats.members.ChatMemberRepository;
import com.pingme.shared.exceptions.BadRequestException;
import com.pingme.shared.exceptions.ForbiddenException;
import com.pingme.shared.exceptions.ResourceNotFound;
import com.pingme.messages.system.SystemMessageContent;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final ChatRepository chatRepository;
    private final ObjectMapper objectMapper;

    public Message getMessage(String messageId) {
        return messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFound("Message not found"));
    }

    public List<Message> getMessagesByIds(List<String> ids) {
        return messageRepository.findByIdIn(ids);
    }

    public Message saveMessage(String chatId, String senderId, String content, MessageType type) {

        boolean isMember = chatMemberRepository.findByChatIdAndUserId(chatId, senderId).isPresent();

        if (!isMember) {
            throw new ForbiddenException("Current user doesn't belong to this chat");
        }

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFound("Chat not found"));

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

    public Message editMessage(String messageId, String userId, String newContent) {
        Message message = getMessage(messageId);

        if (!message.getSenderId().equals(userId)) {
            throw new ForbiddenException("You can only edit your own messages");
        }

        if (message.isDeleted()) {
            throw new BadRequestException("Cannot edit a deleted message");
        }

        message.setContent(newContent);
        message.setEditedAt(Instant.now());

        return messageRepository.save(message);
    }

    public Message deleteMessage(String messageId, String userId) {
        Message message = getMessage(messageId);

        if (!message.getSenderId().equals(userId)) {
            throw new ForbiddenException("You can only delete your own messages");
        }

        if (message.isDeleted()) {
            throw new BadRequestException("Message is already deleted");
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
}