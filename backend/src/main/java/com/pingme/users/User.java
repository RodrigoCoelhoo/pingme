package com.pingme.users;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDateTime;

@Document(collection = "users")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    @Indexed(unique = true)
    private String username;

    private String password; // null for OAuth users

    private String displayName;

    private String avatarUrl;
    private String avatarPublicId;

    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    private String providerId;

    private LocalDateTime lastSeenAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}