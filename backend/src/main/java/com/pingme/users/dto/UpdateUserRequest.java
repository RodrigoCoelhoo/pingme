package com.pingme.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank(message = "Display name cannot be blank")
        @Size(min = 1, max = 50)
        String displayName
){}