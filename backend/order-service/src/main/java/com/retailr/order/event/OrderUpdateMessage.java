package com.retailr.order.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderUpdateMessage {
    private String orderNumber;
    private String status;
    private BigDecimal total;
    private String customer;
    private long timestamp;
}
