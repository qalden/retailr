package com.retailr.catalog.exception;

public class BadPaginationException extends RuntimeException {
    public BadPaginationException(String message) {
        super(message);
    }
}
