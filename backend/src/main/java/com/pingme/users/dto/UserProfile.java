package com.pingme.users.dto;

public record UserProfile(
        String id,
        String email,
        String username,
        String displayName,
        String avatarUrl
){}
