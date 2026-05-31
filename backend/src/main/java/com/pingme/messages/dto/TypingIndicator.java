package com.pingme.messages.dto;

public record TypingIndicator(
        String chatId,
        String userId,
        String displayName,
        boolean isTyping
) {}
