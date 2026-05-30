package com.retailr.order.exception;

public class DuplicateEmailException extends OrderException {
    public DuplicateEmailException(String message) {
        super(message);
    }
}
