package com.pingme.messages;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByChatIdOrderByCreatedAtDesc(String chatId);

    @Query("{ 'chatId': ?0, 'deleted': false }")
    Page<Message> findByChatIdAndDeletedFalse(String chatId, Pageable pageable);

    @Query(value = "{ 'chatId': ?0, 'deleted': false, '_id': { $gt: ?1 } }", count = true)
    long countUnreadMessages(String chatId, String lastReadMessageId);

    List<Message> findByIdIn(List<String> ids);

    Page<Message> findByChatId(String chatId, Pageable pageable);
}