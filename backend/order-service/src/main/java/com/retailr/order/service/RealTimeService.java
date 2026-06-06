package com.retailr.order.service;

import com.retailr.order.event.OrderUpdateEvent;
import com.retailr.order.event.OrderUpdateMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RealTimeService {

    private final SimpMessagingTemplate simpMessagingTemplate;

    public void publishOrderUpdate(OrderUpdateEvent event) {
        OrderUpdateMessage message = OrderUpdateMessage.builder()
                .orderNumber(event.getOrderNumber())
                .status(event.getStatus().toString())
                .total(event.getTotal())
                .customer(event.getCustomerName())
                .timestamp(System.currentTimeMillis())
                .build();

        log.debug("Publishing order update: orderNumber={}, status={}",
                message.getOrderNumber(), message.getStatus());
        simpMessagingTemplate.convertAndSend("/topic/order-updates", message);
    }
}
