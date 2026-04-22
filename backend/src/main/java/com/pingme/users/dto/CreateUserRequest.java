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
    @Size(min = 1, max = 50)
    String displayName,

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 8, max = 100, message = "Password must have between 8 and 100 characters.")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&\\-_])[A-Za-z\\d@$!%*?&\\-_]+$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&-_)"
    )
    String password
) {}