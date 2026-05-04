package com.pingme.chats.dto;

import com.pingme.chats.ChatType;

public record ChatPreview(

        String chatId,
        ChatType chatType,

        String chatName,
        String chatImageUrl,

        String lastMessage,

        int unreadCount
) {}