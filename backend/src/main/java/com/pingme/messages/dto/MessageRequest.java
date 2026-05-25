package com.pingme.messages.dto;

import com.pingme.messages.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MessageRequest(
        @NotBlank(message = "Content cannot be empty")
        @Size(min = 1, max = 1024, message = "Message can't have more than 1024 characters.")
        String content,
        
        @NotNull(message = "Type is required")
        MessageType type
) {}
