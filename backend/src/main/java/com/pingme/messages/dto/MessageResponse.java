package com.pingme.messages.dto;

import com.pingme.messages.Message;
import com.pingme.messages.MessageType;
import com.pingme.users.User;

import java.time.Instant;

public record MessageResponse(
        String messageId,
        String chatId,
        String senderId,
        String senderDisplayName,
        String senderAvatarUrl,
        String content,
        MessageType type,
        Instant createdAt,
        Instant editedAt,
        boolean deleted
) {
    public static MessageResponse from(Message message, User sender) {
        return new MessageResponse(
                message.getId(),
                message.getChatId(),
                message.getSenderId(),
                sender.getDisplayName(),
                sender.getAvatarUrl(),
                message.isDeleted() ? "" : message.getContent(),
                message.getType(),
                message.getCreatedAt(),
                message.getEditedAt(),
                message.isDeleted()
        );
    }
}
