package com.pingme.chats.members;

import com.pingme.chats.Chat;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ChatMemberRepository extends MongoRepository<ChatMember, String> {

    List<ChatMember> findByUserIdAndActiveTrue(String userId);

    List<ChatMember> findByChatId(String chatId);

    Optional<ChatMember> findByChatIdAndUserId(String chatId, String userId);

    List<ChatMember> findByChatIdInAndUserIdNot(List<String> chatIds, String userId);

    @Aggregation(pipeline = {
            "{ $match: { userId: { $in: [?0, ?1] } } }",
            "{ $group: { _id: '$chatId', users: { $addToSet: '$userId' } } }",
            "{ $match: { users: { $all: [?0, ?1] } } }",
            "{ $lookup: { from: 'chats', localField: '_id', foreignField: '_id', as: 'chat' } }",
            "{ $unwind: '$chat' }",
            "{ $match: { 'chat.chatType': 'PRIVATE' } }",
            "{ $replaceRoot: { newRoot: '$chat' } }",
            "{ $limit: 1 }"
    })
    Optional<Chat> findPrivateChat(String user1, String user2);

    @Aggregation(pipeline = {
            "{ $match: { chatId: ?0 } }",

            "{ $addFields: { rolePriority: { $switch: { " +
                    "branches: [ " +
                    "{ case: { $eq: ['$role', 'ADMIN'] }, then: 0 }, " +
                    "{ case: { $eq: ['$role', 'MODERATOR'] }, then: 1 }, " +
                    "{ case: { $eq: ['$role', 'MEMBER'] }, then: 2 } " +
                    "], " +
                    "default: 3 } } } }",

            "{ $sort: { rolePriority: 1, userId: 1 } }",

            "{ $skip: ?1 }",
            "{ $limit: ?2 }"
    })
    List<ChatMember> findPagedMembers(String chatId, int skip, int limit);

    long countByChatId(String chatId);
}