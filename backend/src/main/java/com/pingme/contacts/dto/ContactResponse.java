package com.pingme.contacts.dto;

import java.time.Instant;

public record ContactResponse(
        String contactId,
        String userId,
        String username,
        String avatarUrl,
        Instant createdAt
) {}