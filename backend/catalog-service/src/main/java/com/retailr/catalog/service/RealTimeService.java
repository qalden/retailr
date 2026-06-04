package com.retailr.catalog.service;

import com.retailr.catalog.event.StockUpdateEvent;
import com.retailr.catalog.event.StockUpdateMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RealTimeService {

    private final SimpMessagingTemplate simpMessagingTemplate;

    public void publishStockUpdate(StockUpdateEvent event) {
        if (event == null) {
            throw new IllegalArgumentException("StockUpdateEvent cannot be null");
        }

        log.debug("Publishing stock update via WebSocket: productId={}, warehouseId={}, newQuantity={}",
                event.getProductId(), event.getWarehouseId(), event.getNewQuantity());

        StockUpdateMessage message = StockUpdateMessage.builder()
                .sku(event.getSku())
                .warehouse(event.getWarehouse())
                .quantity(event.getNewQuantity())
                .reserved(event.getReservedQuantity())
                .alert(event.getAlert() != null ? event.getAlert() : false)
                .timestamp(System.currentTimeMillis())
                .build();

        simpMessagingTemplate.convertAndSend("/topic/stock-updates", message);

        log.info("Published stock update to /topic/stock-updates: sku={}, warehouse={}, quantity={}, alert={}",
                message.getSku(), message.getWarehouse(), message.getQuantity(), message.isAlert());
    }
}
