package com.pingme.chats.members;

/*import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Repository
public class ChatMemberRepositoryImpl {

    @Autowired
    private MongoTemplate mongoTemplate;

    public Page<ChatMemberProjection> findUserChatsWithSearch(
            String userId,
            String search,
            Pageable pageable
    ) {

        List<AggregationOperation> operations = new ArrayList<>();

        // 1. Match current user's memberships
        operations.add(
                Aggregation.match(
                        Criteria.where("userId").is(userId)
                                .and("active").is(true)
                )
        );

        // 2. Lookup chat details
        operations.add(
                Aggregation.lookup(
                        "chat",
                        "chatId",
                        "_id",
                        "chatInfo"
                )
        );

        operations.add(
                Aggregation.unwind("chatInfo")
        );

        // 3. Lookup ONLY the other member for PRIVATE chats
        operations.add(buildPrivateChatLookup(userId));

        operations.add(
                Aggregation.unwind("otherMember", true)
        );

        // 4. Lookup other user details
        operations.add(
                Aggregation.lookup(
                        "user",
                        "otherMember.userId",
                        "_id",
                        "otherUserInfo"
                )
        );

        operations.add(
                Aggregation.unwind("otherUserInfo", true)
        );

        // 5. Compute chat name
        operations.add(
                Aggregation.addFields()
                        .addField("computedChatName")
                        .withValue(
                                ConditionalOperators.when(
                                                ComparisonOperators.Eq.valueOf("$chatInfo.chatType")
                                                        .equalToValue("PRIVATE")
                                        )
                                        .then("$otherUserInfo.displayName")
                                        .otherwise("$chatInfo.chatName")
                        )
                        .build()
        );

        // 6. Search filter
        if (search != null && !search.isBlank()) {

            operations.add(
                    Aggregation.match(
                            Criteria.where("computedChatName")
                                    .regex(Pattern.quote(search), "i")
                    )
            );
        }

        // 7. Lookup last message
        operations.add(
                Aggregation.lookup(
                        "message",
                        "chatInfo.lastMessageId",
                        "_id",
                        "lastMessageInfo"
                )
        );

        operations.add(
                Aggregation.unwind("lastMessageInfo", true)
        );

        // 8. Sort chats
        operations.add(
                Aggregation.sort(
                        Sort.by(Sort.Direction.DESC, "lastMessageInfo.createdAt")
                                .and(Sort.by(Sort.Direction.DESC, "chatInfo.createdAt"))
                )
        );

        // COUNT QUERY
        List<AggregationOperation> countOperations =
                new ArrayList<>(operations);

        countOperations.add(
                Aggregation.count().as("total")
        );

        Aggregation countAggregation =
                Aggregation.newAggregation(countOperations);

        AggregationResults<Document> countResults =
                mongoTemplate.aggregate(
                        countAggregation,
                        "chatMember",
                        Document.class
                );

        long total = 0;

        if (!countResults.getMappedResults().isEmpty()) {

            total = countResults
                    .getMappedResults()
                    .get(0)
                    .getInteger("total", 0);
        }

        // 9. Pagination
        operations.add(
                Aggregation.skip(pageable.getOffset())
        );

        operations.add(
                Aggregation.limit(pageable.getPageSize())
        );

        // 10. Projection
        operations.add(
                Aggregation.project()
                        .and("_id").as("id")
                        .and("chatId").as("chatId")
                        .and("userId").as("userId")
                        .and("role").as("role")
                        .and("muted").as("muted")
                        .and("lastReadMessageId").as("lastReadMessageId")
                        .and("chatInfo").as("chat")
                        .and("otherUserInfo").as("otherUser")
                        .and("lastMessageInfo").as("lastMessage")
                        .and("computedChatName").as("chatName")
        );

        Aggregation aggregation =
                Aggregation.newAggregation(operations);

        List<ChatMemberProjection> results =
                mongoTemplate.aggregate(
                        aggregation,
                        "chatMember",
                        ChatMemberProjection.class
                ).getMappedResults();

        return new PageImpl<>(
                results,
                pageable,
                total
        );
    }

    private AggregationOperation buildPrivateChatLookup(String userId) {

        return context -> new Document("$lookup",
                new Document("from", "chatMember")
                        .append("let", new Document()
                                .append("chatId", "$chatId")
                                .append("chatType", "$chatInfo.chatType")
                        )
                        .append("pipeline", List.of(

                                new Document("$match",
                                        new Document("$expr",
                                                new Document("$and", List.of(

                                                        // only PRIVATE chats
                                                        new Document("$eq", List.of(
                                                                "$$chatType",
                                                                "PRIVATE"
                                                        )),

                                                        // same chat
                                                        new Document("$eq", List.of(
                                                                "$chatId",
                                                                "$$chatId"
                                                        )),

                                                        // exclude current user
                                                        new Document("$ne", List.of(
                                                                "$userId",
                                                                userId
                                                        ))

                                                ))
                                        )
                                ),

                                // only need one user
                                new Document("$limit", 1)

                        ))
                        .append("as", "otherMember")
        );
    }
}*/