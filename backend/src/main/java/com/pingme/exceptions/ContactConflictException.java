package com.pingme.exceptions;

public class ContactConflictException extends RuntimeException {
    public ContactConflictException(String message) {
        super(message);
    }
}
