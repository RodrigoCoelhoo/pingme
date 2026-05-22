package com.pingme.chats.events;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChatEvent(
        ChatEventType type,
        String chatId,
        Object payload
) {
    public static ChatEvent of(ChatEventType type, String chatId) {
        return new ChatEvent(type, chatId, null);
    }

    public static ChatEvent of(ChatEventType type, String chatId, Object payload) {
        return new ChatEvent(type, chatId, payload);
    }
}