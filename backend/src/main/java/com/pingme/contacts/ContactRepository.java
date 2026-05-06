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
            "{ $match: { $or: [ { senderId: ?0 }, { receiverId: ?0 } ], status: ?1 } }",

            "{ $addFields: { " +
                    "otherUserId: { " +
                        "$toObjectId: { " +
                            "$cond: [ { $eq: ['$senderId', ?0] }, '$receiverId', '$senderId' ] " +
                        "} " +
                    "} " +
                "} " +
            "}",

            "{ $lookup: { " +
                    "from: 'users', " +
                    "localField: 'otherUserId', " +
                    "foreignField: '_id', " +
                    "as: 'otherUser' " +
                "} " +
            "}",

            "{ $unwind: '$otherUser' }",

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
                    "createdAt: 1 " +
                "} " +
            "}"
    })
    List<ContactResponse> findContactsWithUserInfo(String userId, ContactStatus status, int skip, int limit);
}
