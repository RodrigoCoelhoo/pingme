package com.pingme.contacts;

import com.pingme.contacts.dto.ContactResponse;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ContactRepository extends MongoRepository<Contact, String> {

    @Query("""
    {
      "$or": [
        { "senderId": ?0, "receiverId": ?1 },
        { "senderId": ?1, "receiverId": ?0 }
      ]
    }
    """)
    Optional<Contact> findContactBetween(String user1, String user2);

    @Query("""
    {
      $or: [
        {
          senderId: ?0,
          receiverId: { $in: ?1 }
        },
        {
          receiverId: ?0,
          senderId: { $in: ?1 }
        }
      ]
    }
    """)
    List<Contact> findContactsBetween(String currentUserId, Set<String> memberIds);

    @Query("{ '_id': ?0, '$or': [ { 'senderId': ?1 }, { 'receiverId': ?1 } ] }")
    Optional<Contact> findByIdAndUser(String id, String userId);

    @Query("""
        {
          "$or": [
            { "senderId": ?0 },
            { "receiverId": ?0 }
          ],
          "status": "ACCEPTED"
        }
    """)
    List<Contact> findAcceptedContacts(String userId);

    @Aggregation(pipeline = {

            // 1. BASE FILTER (status + user role filter)
            "{ $match: { " +
                    "status: ?1, " +
                    "$or: [ " +
                    "{ senderId: ?0 }, " +
                    "{ receiverId: ?0 } " +
                    "] } }",

            // 2. TYPE FILTER - Filter by SENT/RECEIVED
            "{ $match: { " +
                    "$expr: { " +
                    "$or: [ " +

                    // ALL (pendingType is null)
                    "{ $eq: [?5, null] }, " +

                    // SENT only
                    "{ $and: [ " +
                    "{ $eq: [?5, 'SENT'] }, " +
                    "{ $eq: ['$senderId', ?0] } " +
                    "] }, " +

                    // RECEIVED only
                    "{ $and: [ " +
                    "{ $eq: [?5, 'RECEIVED'] }, " +
                    "{ $eq: ['$receiverId', ?0] } " +
                    "] } " +

                    "] } " +
                    "} }",

            // 3. USER JOIN
            "{ $addFields: { " +
                    "otherUserId: { " +
                    "$toObjectId: { " +
                    "$cond: [ { $eq: ['$senderId', ?0] }, '$receiverId', '$senderId' ] " +
                    "} " +
                    "} " +
                    "} }",

            "{ $lookup: { " +
                    "from: 'users', " +
                    "localField: 'otherUserId', " +
                    "foreignField: '_id', " +
                    "as: 'otherUser' " +
                    "} }",

            "{ $unwind: '$otherUser' }",

            // 4. SEARCH - handles @ prefix and case-insensitive matching
            "{ $match: { " +
                    "$expr: { " +
                    "$or: [ " +
                    // Empty search - match all
                    "{ $eq: [?4, ''] }, " +
                    // Search starts with @ - match username
                    "{ $and: [ " +
                    "{ $regexMatch: { input: ?4, regex: '^@' } }, " +
                    "{ $regexMatch: { input: '$otherUser.username', regex: { $substr: [?4, 1, -1] }, options: 'i' } } " +
                    "] }, " +
                    // Search doesn't start with @ - match displayName
                    "{ $and: [ " +
                    "{ $not: { $regexMatch: { input: ?4, regex: '^@' } } }, " +
                    "{ $regexMatch: { input: '$otherUser.displayName', regex: ?4, options: 'i' } } " +
                    "] } " +
                    "] " +
                    "} " +
                    "} }",

            "{ $sort: { 'otherUser.username': 1 } }",

            "{ $skip: ?2 }",
            "{ $limit: ?3 }",

            "{ $project: { " +
                    "contactId: '$_id', " +
                    "userId: '$otherUserId', " +
                    "displayName: '$otherUser.displayName', " +
                    "username: '$otherUser.username', " +
                    "avatarUrl: '$otherUser.avatarUrl', " +
                    "status: '$status', " +
                    "senderId: '$senderId', " +
                    "receiverId: '$receiverId', " +
                    "createdAt: 1 " +
                    "} }"
    })
    List<ContactResponse> findContactsWithUserInfo(String userId, ContactStatus status, int skip, int limit, String search, String pendingType);

    @Aggregation(pipeline = {

            "{ $match: { " +
                    "status: ?1, " +
                    "$or: [ " +
                    "{ senderId: ?0 }, " +
                    "{ receiverId: ?0 } " +
                    "] } }",

            "{ $match: { " +
                    "$expr: { " +
                    "$or: [ " +

                    "{ $eq: [?3, null] }, " +

                    "{ $and: [ " +
                    "{ $eq: [?3, 'SENT'] }, " +
                    "{ $eq: ['$senderId', ?0] } " +
                    "] }, " +

                    "{ $and: [ " +
                    "{ $eq: [?3, 'RECEIVED'] }, " +
                    "{ $eq: ['$receiverId', ?0] } " +
                    "] } " +

                    "] } " +
                    "} }",

            "{ $addFields: { " +
                    "otherUserId: { " +
                    "$toObjectId: { " +
                    "$cond: [ { $eq: ['$senderId', ?0] }, '$receiverId', '$senderId' ] " +
                    "} " +
                    "} " +
                    "} }",

            "{ $lookup: { " +
                    "from: 'users', " +
                    "localField: 'otherUserId', " +
                    "foreignField: '_id', " +
                    "as: 'otherUser' " +
                    "} }",

            "{ $unwind: '$otherUser' }",

            "{ $match: { " +
                    "$expr: { " +
                    "$or: [ " +
                    "{ $eq: [?2, ''] }, " +
                    "{ $and: [ " +
                    "{ $regexMatch: { input: ?2, regex: '^@' } }, " +
                    "{ $regexMatch: { input: '$otherUser.username', regex: { $substr: [?2, 1, -1] }, options: 'i' } } " +
                    "] }, " +
                    "{ $and: [ " +
                    "{ $not: { $regexMatch: { input: ?2, regex: '^@' } } }, " +
                    "{ $regexMatch: { input: '$otherUser.displayName', regex: ?2, options: 'i' } } " +
                    "] } " +
                    "] " +
                    "} " +
                    "} }",

            "{ $count: 'total' }"
    })
    Long countContacts(
            String userId,
            ContactStatus status,
            String search,
            String pendingType
    );
}
