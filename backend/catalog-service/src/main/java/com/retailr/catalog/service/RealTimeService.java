package com.retailr.catalog.service;

import com.retailr.catalog.entity.Product;
import com.retailr.catalog.entity.StockItem;
import com.retailr.catalog.event.StockUpdateEvent;
import com.retailr.catalog.event.StockUpdateMessage;
import com.retailr.catalog.event.StockUpdatePublisher;
import com.retailr.catalog.repository.ProductRepository;
import com.retailr.catalog.repository.StockItemRepository;
import com.retailr.catalog.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class RealTimeService {

    private final StockItemRepository stockItemRepository;
    private final StockUpdatePublisher stockUpdatePublisher;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;

    public void notifyStockAdjustment(StockItem item, Integer previousQty, Integer newQty) {
        log.debug("Notifying stock adjustment: stockItemId={}, previous={}, new={}",
                item.getId(), previousQty, newQty);

        if (item.getProduct() == null || item.getWarehouse() == null) {
            throw new IllegalArgumentException("StockItem must have product and warehouse initialized");
        }

        validateProductId(item.getProduct().getId());
        validateWarehouseId(item.getWarehouse().getId());
        validateQuantity(previousQty);
        validateQuantity(newQty);

        StockUpdateEvent event = StockUpdateEvent.builder()
                .productId(item.getProduct().getId())
                .warehouseId(item.getWarehouse().getId())
                .previousQuantity(previousQty)
                .newQuantity(newQty)
                .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
                .timestamp(LocalDateTime.now())
                .build();

        log.debug("Publishing stock adjustment event: productId={}, warehouseId={}",
                event.getProductId(), event.getWarehouseId());
        stockUpdatePublisher.publishStockUpdate(event);

        // Check if low stock threshold is breached
        Product product = item.getProduct();
        if (newQty <= product.getLowStockThreshold()) {
            log.info("Low stock alert triggered for product={}, warehouseId={}, newQty={}, threshold={}",
                    product.getId(), item.getWarehouse().getId(), newQty, product.getLowStockThreshold());
            stockUpdatePublisher.publishLowStockAlert(product, item.getWarehouse().getId());
        }
    }

    public void notifyOrderConfirmation(Long productId, Long warehouseId, Integer quantity) {
        log.debug("Notifying order confirmation: productId={}, warehouseId={}, quantity={}",
                productId, warehouseId, quantity);

        validateProductId(productId);
        validateWarehouseId(warehouseId);
        validateQuantity(quantity);

        StockItem stockItem = stockItemRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "StockItem not found for product: " + productId + ", warehouse: " + warehouseId));

        Integer previousQty = stockItem.getQuantity();
        Integer newQty = previousQty - quantity;

        StockUpdateEvent event = StockUpdateEvent.builder()
                .productId(productId)
                .warehouseId(warehouseId)
                .previousQuantity(previousQty)
                .newQuantity(newQty)
                .movementType(StockUpdateEvent.MovementType.ORDER_CONFIRMATION)
                .timestamp(LocalDateTime.now())
                .build();

        log.debug("Publishing order confirmation event: productId={}, warehouseId={}, reserved={}",
                event.getProductId(), event.getWarehouseId(), quantity);
        stockUpdatePublisher.publishStockUpdate(event);

        // Check if low stock threshold is breached
        Product product = stockItem.getProduct();
        if (product == null) {
            throw new IllegalArgumentException("StockItem must have product initialized");
        }
        if (newQty <= product.getLowStockThreshold()) {
            log.info("Low stock alert triggered for product={}, warehouseId={}, newQty={}, threshold={}",
                    product.getId(), warehouseId, newQty, product.getLowStockThreshold());
            stockUpdatePublisher.publishLowStockAlert(product, warehouseId);
        }
    }

    public void notifyStockReturn(Long productId, Long warehouseId, Integer quantity) {
        log.debug("Notifying stock return: productId={}, warehouseId={}, quantity={}",
                productId, warehouseId, quantity);

        validateProductId(productId);
        validateWarehouseId(warehouseId);
        validateQuantity(quantity);

        StockItem stockItem = stockItemRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "StockItem not found for product: " + productId + ", warehouse: " + warehouseId));

        Integer previousQty = stockItem.getQuantity();
        Integer newQty = previousQty + quantity;

        StockUpdateEvent event = StockUpdateEvent.builder()
                .productId(productId)
                .warehouseId(warehouseId)
                .previousQuantity(previousQty)
                .newQuantity(newQty)
                .movementType(StockUpdateEvent.MovementType.RETURN)
                .timestamp(LocalDateTime.now())
                .build();

        log.debug("Publishing stock return event: productId={}, warehouseId={}, returned={}",
                event.getProductId(), event.getWarehouseId(), quantity);
        stockUpdatePublisher.publishStockUpdate(event);
    }

    private void validateProductId(Long productId) {
        if (productId == null || productId <= 0) {
            throw new IllegalArgumentException("Invalid productId");
        }
    }

    private void validateWarehouseId(Long warehouseId) {
        if (warehouseId == null || warehouseId <= 0) {
            throw new IllegalArgumentException("Invalid warehouseId");
        }
    }

    private void validateQuantity(Integer quantity) {
        if (quantity == null || quantity < 0) {
            throw new IllegalArgumentException("Invalid quantity: cannot be negative");
        }
    }

    public void publishStockUpdate(StockUpdateEvent event) {
        if (event == null) {
            throw new IllegalArgumentException("StockUpdateEvent cannot be null");
        }

        validateProductId(event.getProductId());
        validateWarehouseId(event.getWarehouseId());
        validateQuantity(event.getNewQuantity());

        log.debug("Publishing stock update via WebSocket: productId={}, warehouseId={}, newQuantity={}",
                event.getProductId(), event.getWarehouseId(), event.getNewQuantity());

        // Fetch product and warehouse names for the message
        Product product = productRepository.findById(event.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + event.getProductId()));

        StockItem stockItem = stockItemRepository.findByProductIdAndWarehouseId(
                event.getProductId(), event.getWarehouseId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "StockItem not found for product: " + event.getProductId() +
                        ", warehouse: " + event.getWarehouseId()));

        String warehouseName = stockItem.getWarehouse().getName();
        Integer reservedQuantity = stockItem.getReservedQuantity();

        // Determine if alert is needed (quantity at or below threshold)
        boolean shouldAlert = event.getNewQuantity() <= product.getLowStockThreshold();

        // Create and send the stock update message
        StockUpdateMessage message = StockUpdateMessage.builder()
                .sku(product.getSku())
                .warehouse(warehouseName)
                .quantity(event.getNewQuantity())
                .reserved(reservedQuantity)
                .alert(shouldAlert)
                .timestamp(System.currentTimeMillis())
                .build();

        simpMessagingTemplate.convertAndSend("/topic/stock-updates", message);

        log.info("Published stock update to /topic/stock-updates: sku={}, warehouse={}, quantity={}, alert={}",
                message.getSku(), message.getWarehouse(), message.getQuantity(), message.isAlert());
    }
}
