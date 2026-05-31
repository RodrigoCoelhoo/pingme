package com.pingme.shared.events;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record Event(
        EventType type,
        String chatId,
        String contactId,
        Object payload
) {
    public static Event of(EventType type, String chatId) {
        return new Event(type, chatId, null,null);
    }

    public static Event of(EventType type, String chatId, Object payload) {
        return new Event(type, chatId, null, payload);
    }

    public static Event of(EventType type, String chatId, String contactId) {
        return new Event(type, chatId, contactId, null);
    }

    public static Event contact(EventType type, String contactId) {
        return new Event(type, null, contactId, null);
    }

    public static Event contact(EventType type, String contactId, Object payload) {
        return new Event(type, null, contactId, payload);
    }
}