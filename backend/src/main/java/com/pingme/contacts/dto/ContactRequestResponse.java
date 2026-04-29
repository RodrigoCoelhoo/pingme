package com.pingme.contacts.dto;

import com.pingme.contacts.Contact;
import com.pingme.contacts.ContactStatus;

import java.time.Instant;

public record ContactRequestResponse(
        String id,
        String receiverId,
        ContactStatus contactStatus,
        Instant createdAt
) {
    public static ContactRequestResponse format(Contact contact) {
        return new ContactRequestResponse(
                contact.getId(),
                contact.getReceiverId(),
                contact.getStatus(),
                contact.getCreatedAt()
        );
    }
}
