package com.pingme.shared.presence;

import java.time.Instant;

public record PresenceEvent(
        String userId,
        PresenceStatus status,
        Instant lastSeenAt
) {}