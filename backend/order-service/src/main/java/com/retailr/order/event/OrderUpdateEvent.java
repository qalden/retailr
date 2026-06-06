package com.retailr.order.event;

import com.retailr.order.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderUpdateEvent {
    private String orderNumber;
    private OrderStatus status;
    private BigDecimal total;
    private String customerName;
}
