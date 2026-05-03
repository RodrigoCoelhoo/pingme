package com.pingme.chats;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;

public interface ChatRepository extends MongoRepository<Chat, String> {
    @Query("{ 'chatType': ?0, 'memberIds': { $all: [?1, ?2] } }")
    Optional<Chat> findPrivateChat(ChatType type, String user1, String user2);

    Optional<Chat> findByIdAndMemberIdsContains(String chatId, String userId);
}