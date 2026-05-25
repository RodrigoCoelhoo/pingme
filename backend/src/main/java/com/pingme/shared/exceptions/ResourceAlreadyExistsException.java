package com.pingme.shared.exceptions;

public class ResourceAlreadyExistsException extends RuntimeException {
    public ResourceAlreadyExistsException(String message) {
        super(message);
    }
}
