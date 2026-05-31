package com.pingme.chats.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChatDTO(
        @NotNull(message = "membersIds cannot be null")
        @Size(min = 1, message = "membersIds can't be empty")
        List<String> membersIds,

        @NotNull(message = "Chat name cannot be null")
        @Size(min = 1, max = 50)
        String chatName
) {}