package com.pingme.users.dto;

public record UserResponse(
    String id,
    String email,
    String username,
    String displayName,
    String avatarUrl
) { }
