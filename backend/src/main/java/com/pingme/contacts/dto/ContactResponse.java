package com.pingme.contacts.dto;

import com.pingme.contacts.ContactStatus;

import java.time.Instant;

public record ContactResponse(
        String contactId,
        String userId,
        String displayName,
        String username,
        String avatarUrl,
        ContactStatus contactStatus,
        Instant createdAt
) {}