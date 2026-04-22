package com.pingme.exceptions;

public class ResourceNotFound extends RuntimeException {
    public ResourceNotFound(String msg) {
        super(msg);
    }
}
