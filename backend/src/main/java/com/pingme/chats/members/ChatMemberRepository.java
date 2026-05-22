package com.pingme.chats.members;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ChatMemberRepository extends MongoRepository<ChatMember, String> {

    List<ChatMember> findByUserIdAndActiveTrue(String userId);

    List<ChatMember> findByChatIdAndActiveTrue(String chatId);

    List<ChatMember> findByChatIdAndMutedFalseAndActiveFalse(String chatId);

    List<ChatMember> findByChatId(String chatId);

    Optional<ChatMember> findByChatIdAndUserId(String chatId, String userId);

    @Aggregation(pipeline = {

            // Base filter
            "{ $match: { chatId: ?0, active: true } }",

            // User join
            "{ $addFields: { userObjectId: { $toObjectId: '$userId' } } }",

            "{ $lookup: { " +
                    "from: 'users', " +
                    "localField: 'userObjectId', " +
                    "foreignField: '_id', " +
                    "as: 'user' " +
                    "} }",

            "{ $unwind: '$user' }",

            // Search
            "{ $match: { " +
                    "$expr: { " +
                    "$or: [ " +

                    // Empty search
                    "{ $eq: [?3, ''] }, " +

                    // @username
                    "{ $and: [ " +
                    "{ $regexMatch: { input: ?3, regex: '^@' } }, " +
                    "{ $regexMatch: { " +
                    "input: '$user.username', " +
                    "regex: { $substr: [?3, 1, -1] }, " +
                    "options: 'i' " +
                    "} } " +
                    "] }, " +

                    // displayName
                    "{ $and: [ " +
                    "{ $not: { $regexMatch: { input: ?3, regex: '^@' } } }, " +
                    "{ $regexMatch: { " +
                    "input: '$user.displayName', " +
                    "regex: ?3, " +
                    "options: 'i' " +
                    "} } " +
                    "] } " +

                    "] " +
                    "} " +
                    "} }",

            // Role ordering
            "{ $addFields: { rolePriority: { $switch: { " +
                    "branches: [ " +
                    "{ case: { $eq: ['$role', 'ADMIN'] }, then: 0 }, " +
                    "{ case: { $eq: ['$role', 'MODERATOR'] }, then: 1 }, " +
                    "{ case: { $eq: ['$role', 'MEMBER'] }, then: 2 } " +
                    "], " +
                    "default: 3 } } } }",

            // Sort
            "{ $sort: { rolePriority: 1, 'user.displayName': 1 } }",

            // Pagination
            "{ $skip: ?1 }",
            "{ $limit: ?2 }"
    })
    List<ChatMember> findPagedMembers(
            String chatId,
            int skip,
            int limit,
            String search
    );

    @Aggregation(pipeline = {

            // Base filter
            "{ $match: { chatId: ?0, active: true } }",

            // User join
            "{ $addFields: { userObjectId: { $toObjectId: '$userId' } } }",

            "{ $lookup: { " +
                    "from: 'users', " +
                    "localField: 'userObjectId', " +
                    "foreignField: '_id', " +
                    "as: 'user' " +
                    "} }",

            "{ $unwind: '$user' }",

            // Search
            "{ $match: { " +
                    "$expr: { " +
                    "$or: [ " +

                    // Empty search
                    "{ $eq: [?1, ''] }, " +

                    // @username
                    "{ $and: [ " +
                    "{ $regexMatch: { input: ?1, regex: '^@' } }, " +
                    "{ $regexMatch: { " +
                    "input: '$user.username', " +
                    "regex: { $substr: [?1, 1, -1] }, " +
                    "options: 'i' " +
                    "} } " +
                    "] }, " +

                    // displayName
                    "{ $and: [ " +
                    "{ $not: { $regexMatch: { input: ?1, regex: '^@' } } }, " +
                    "{ $regexMatch: { " +
                    "input: '$user.displayName', " +
                    "regex: ?1, " +
                    "options: 'i' " +
                    "} } " +
                    "] } " +

                    "] " +
                    "} " +
                    "} }",

            "{ $count: 'total' }"
    })
    Long countMembersWithSearch(String chatId, String search);

    List<ChatMember> findByChatIdAndUserIdInAndActiveFalse(String chatId, Set<String> userIds);
}