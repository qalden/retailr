package com.retailr.order.exception;

public class CustomerNotFoundException extends OrderException {
    public CustomerNotFoundException(String message) {
        super(message);
    }
}
