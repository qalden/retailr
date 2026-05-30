package com.retailr.order.exception;

public class InsufficientStockException extends OrderException {
    public InsufficientStockException(String message) {
        super(message);
    }
}
