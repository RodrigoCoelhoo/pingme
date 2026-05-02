package com.pingme.chats.members;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ChatMemberRepository extends MongoRepository<ChatMember, String> {

    List<ChatMember> findByUserIdAndActiveTrue(String userId);

    List<ChatMember> findByChatId(String chatId);

    Optional<ChatMember> findByChatIdAndUserId(String chatId, String userId);
}