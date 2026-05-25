package com.pingme.chats.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateChatRequest(
        @NotNull(message = "Chat name cannot be null")
        @Size(min = 1, max = 50)
        String chatName
) {}
