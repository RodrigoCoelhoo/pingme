package com.pingme.chats;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ChatRepository extends MongoRepository<Chat, String> {
    Optional<Chat> findByChatTypeAndMemberIdsContainingAndMemberIdsContaining(
            ChatType type,
            String user1,
            String user2
    );

    Optional<Chat> findByIdAndMemberIdsContains(String chatId, String userId);
}