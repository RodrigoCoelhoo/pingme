package com.pingme.messages.dto;

import com.pingme.messages.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MessageRequest(
        @NotBlank(message = "Content cannot be empty")
        String content,
        
        @NotNull(message = "Type is required")
        MessageType type
) {}
