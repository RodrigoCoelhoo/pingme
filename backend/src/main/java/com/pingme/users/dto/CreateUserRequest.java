package com.pingme.users.dto;

import jakarta.validation.constraints.*;

public record CreateUserRequest(
    @NotBlank(message = "Username cannot be blank")
    @Size(min = 3, max = 50)
    @Pattern(
            regexp = "^[A-Za-z0-9_-]+$",
            message = "Username can only contain letters, numbers, underscores, and hyphens"
    )
    String username,

    @NotBlank(message = "Display name cannot be blank")
    @Size(min = 2, max = 50)
    String displayName,

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, message = "Password must be at least 6 characters")
    String password
) {}