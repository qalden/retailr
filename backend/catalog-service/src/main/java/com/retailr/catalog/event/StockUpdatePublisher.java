package com.retailr.catalog.event;

import com.retailr.catalog.entity.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockUpdatePublisher {

    private final SimpMessagingTemplate simpMessagingTemplate;

    public void publishStockUpdate(StockUpdateEvent event) {
        if (event.getProductId() == null || event.getProductId() <= 0) {
            throw new IllegalArgumentException("Invalid productId");
        }
        if (event.getWarehouseId() == null || event.getWarehouseId() <= 0) {
            throw new IllegalArgumentException("Invalid warehouseId");
        }
        if (event.getPreviousQuantity() == null || event.getPreviousQuantity() < 0) {
            throw new IllegalArgumentException("Invalid previousQuantity");
        }
        if (event.getNewQuantity() == null || event.getNewQuantity() < 0) {
            throw new IllegalArgumentException("Invalid newQuantity");
        }

        // Publish to global stock updates topic
        simpMessagingTemplate.convertAndSend("/topic/stock-updates", event);
        log.info("Published stock update to /topic/stock-updates: productId={}, warehouseId={}, previous={}, new={}, type={}",
                event.getProductId(), event.getWarehouseId(), event.getPreviousQuantity(),
                event.getNewQuantity(), event.getMovementType());

        // Publish to warehouse-specific topic
        String warehouseTopic = "/topic/stock-updates/warehouse/" + event.getWarehouseId();
        simpMessagingTemplate.convertAndSend(warehouseTopic, event);
        log.info("Published stock update to {}: productId={}, previous={}, new={}, type={}",
                warehouseTopic, event.getProductId(), event.getPreviousQuantity(),
                event.getNewQuantity(), event.getMovementType());
    }

    public void publishLowStockAlert(Product product, long warehouseId) {
        if (product == null || product.getId() == null || product.getId() <= 0) {
            throw new IllegalArgumentException("Invalid product");
        }
        if (warehouseId <= 0) {
            throw new IllegalArgumentException("Invalid warehouseId");
        }

        String topic = "/topic/low-stock-alerts/warehouse/" + warehouseId;
        LowStockAlertMessage alert = LowStockAlertMessage.builder()
                .productId(product.getId())
                .productName(product.getName())
                .warehouseId(warehouseId)
                .threshold(product.getLowStockThreshold())
                .timestamp(java.time.LocalDateTime.now())
                .build();

        simpMessagingTemplate.convertAndSend(topic, alert);
        log.info("Published low-stock alert to {}: productId={}, productName={}, threshold={}",
                topic, product.getId(), product.getName(), product.getLowStockThreshold());
    }
}
