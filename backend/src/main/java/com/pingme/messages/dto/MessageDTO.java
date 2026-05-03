package com.pingme.messages.dto;

import com.pingme.messages.MessageType;

public record MessageDTO(
        String chatId,
        String content,
        MessageType type
) {}