package com.retailr.catalog.service;

import com.retailr.catalog.entity.Product;
import com.retailr.catalog.entity.StockItem;
import com.retailr.catalog.event.StockUpdateEvent;
import com.retailr.catalog.event.StockUpdatePublisher;
import com.retailr.catalog.repository.ProductRepository;
import com.retailr.catalog.repository.StockItemRepository;
import com.retailr.catalog.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    public void notifyStockAdjustment(StockItem item, Integer previousQty, Integer newQty) {
        log.debug("Notifying stock adjustment: stockItemId={}, previous={}, new={}",
                item.getId(), previousQty, newQty);

        validateInputs(item.getProduct().getId(), item.getWarehouse().getId(), previousQty, newQty);

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

        validateInputs(productId, warehouseId, quantity, null);

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
        if (newQty <= product.getLowStockThreshold()) {
            log.info("Low stock alert triggered for product={}, warehouseId={}, newQty={}, threshold={}",
                    product.getId(), warehouseId, newQty, product.getLowStockThreshold());
            stockUpdatePublisher.publishLowStockAlert(product, warehouseId);
        }
    }

    public void notifyStockReturn(Long productId, Long warehouseId, Integer quantity) {
        log.debug("Notifying stock return: productId={}, warehouseId={}, quantity={}",
                productId, warehouseId, quantity);

        validateInputs(productId, warehouseId, quantity, null);

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

    private void validateInputs(Long productId, Long warehouseId, Integer qty1, Integer qty2) {
        if (productId == null || productId <= 0) {
            throw new IllegalArgumentException("Invalid productId");
        }
        if (warehouseId == null || warehouseId <= 0) {
            throw new IllegalArgumentException("Invalid warehouseId");
        }
        if (qty1 != null && qty1 < 0) {
            throw new IllegalArgumentException("Invalid quantity: cannot be negative");
        }
        if (qty2 != null && qty2 < 0) {
            throw new IllegalArgumentException("Invalid quantity: cannot be negative");
        }
    }
}
