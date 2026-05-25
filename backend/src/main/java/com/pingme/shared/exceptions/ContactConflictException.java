package com.pingme.shared.exceptions;

public class ContactConflictException extends RuntimeException {
    public ContactConflictException(String message) {
        super(message);
    }
}
