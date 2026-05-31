package com.pingme.chats;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "chats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@CompoundIndex(
        name = "private_chat_key_unique",
        def = "{'privateChatKey': 1}",
        unique = true,
        sparse = true
)
public class Chat {

    @Id
    private String id;

    private String chatName;

    private String imageUrl;
    private String imagePublicId;

    private ChatType chatType; // PRIVATE or GROUP
    private String privateChatKey;

    private String lastMessageId;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}