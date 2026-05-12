package com.pingme.chats.members.dto;

import com.pingme.chats.members.ChatRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateRole(
        @NotBlank(message = "User id can't be blank")
        String userId,

        @NotNull(message = "Role can't be null")
        ChatRole role
) {
}
