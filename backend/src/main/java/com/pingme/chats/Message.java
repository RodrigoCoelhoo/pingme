package com.pingme.chats;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "messages")
public class Message {

    @Id
    private String id;

    private String chatId;

    private String senderId;

    private String content;

    private Instant createdAt;

    private Instant editedAt; // nullable

    private MessageType type; // TEXT, IMAGE, FILE, etc.
}