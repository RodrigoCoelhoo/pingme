package com.pingme.chats.dto;

import com.pingme.chats.ChatType;
import com.pingme.chats.members.ChatRole;

import java.time.Instant;

public record ChatPreview(

        String chatId,
        ChatType chatType,

        String chatName,
        String chatImageUrl,

        String lastMessageId,
        String lastMessage,
        Instant lastMessageTimestamp,
        Boolean lastMessageDeleted,

        ChatRole role,
        boolean muted,

        int unreadCount,

        String otherUserId,
        Instant otherUserLastSeenAt
) {}