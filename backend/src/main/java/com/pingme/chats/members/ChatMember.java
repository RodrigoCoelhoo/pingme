package com.pingme.chats.members;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "chat_members")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

@CompoundIndex(
        name = "chat_user_unique",
        def = "{'chatId': 1, 'userId': 1}",
        unique = true
)
public class ChatMember {

    @Id
    private String id;

    private String chatId;
    private String userId;
    private ChatRole role;

    private boolean active;
    private boolean muted;

    private String lastReadMessageId;

    @CreatedDate
    private Instant joinedAt;
}