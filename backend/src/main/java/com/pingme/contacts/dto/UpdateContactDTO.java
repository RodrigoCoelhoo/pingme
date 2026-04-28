package com.pingme.contacts.dto;

import com.pingme.contacts.ContactStatus;

public record UpdateContactDTO(
        ContactStatus status
) {
}
