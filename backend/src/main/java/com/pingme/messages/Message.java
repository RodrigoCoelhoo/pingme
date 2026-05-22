package com.pingme.messages;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    private String id;
    private String chatId;

    private String senderId;
    private String content;

    private Instant createdAt;
    private Instant editedAt; // nullable

    private MessageType type; // TEXT, IMAGE, FILE, SYSTEM etc.

    @Builder.Default
    private boolean deleted = false;
}