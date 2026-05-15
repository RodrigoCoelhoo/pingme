package com.pingme.messages;

import com.pingme.chats.Chat;
import com.pingme.chats.ChatService;
import com.pingme.exceptions.BadRequestException;
import com.pingme.exceptions.ForbiddenException;
import com.pingme.exceptions.ResourceNotFound;
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
    private final ChatService chatService;

    public Message getMessage(String messageId) {
        return messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFound("Message not found"));
    }

    public List<Message> getMessagesByIds(List<String> ids) {
        return messageRepository.findByIdIn(ids);
    }

    public Message saveMessage(String chatId, String senderId, String content, MessageType type) {
        Message message = Message.builder()
                .chatId(chatId)
                .senderId(senderId)
                .content(content)
                .type(type)
                .createdAt(Instant.now())
                .deleted(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        Chat chat = chatService.getChat(chatId, senderId);
        chat.setLastMessageId(savedMessage.getId());
        chatService.save(chat);

        return savedMessage;
    }

    public Page<Message> getMessagesByChatId(String chatId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return messageRepository.findByChatId(chatId, pageable);
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
}