package com.pingme.chats.dto;

import com.pingme.chats.Chat;

import java.util.List;

public record ChatResponse(
        String chatName,
        List<String> membersIds
) {
    public static ChatResponse format(Chat chat) {
        return new ChatResponse(
                chat.getChatName(),
                chat.getMemberIds()
        );
    }
}
