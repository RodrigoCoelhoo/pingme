package com.pingme.chats;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "chats")
public class Chat {

    @Id
    private String id;

    private String chatName;

    private ChatType chatType; // PRIVATE or GROUP

    private List<String> memberIds;

    private String lastMessageId;

    private Instant createdAt;

    private Instant updatedAt;
}