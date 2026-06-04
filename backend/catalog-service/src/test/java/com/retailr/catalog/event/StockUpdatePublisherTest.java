package com.retailr.catalog.event;

import com.retailr.catalog.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class StockUpdatePublisherTest {

    @Autowired
    private StockUpdatePublisher stockUpdatePublisher;

    private StockUpdateEvent validEvent;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        validEvent = StockUpdateEvent.builder()
                .productId(1L)
                .warehouseId(1L)
                .previousQuantity(100)
                .newQuantity(90)
                .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
                .timestamp(LocalDateTime.now())
                .build();

        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setName("Test Product");
        testProduct.setLowStockThreshold(10);
    }

    @Test
    void testPublishStockUpdate_HappyPath() {
        assertDoesNotThrow(() -> stockUpdatePublisher.publishStockUpdate(validEvent));
    }

    @Test
    void testPublishStockUpdate_WithDifferentWarehouseIds() {
        StockUpdateEvent event2 = StockUpdateEvent.builder()
                .productId(1L)
                .warehouseId(2L)
                .previousQuantity(100)
                .newQuantity(90)
                .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
                .timestamp(LocalDateTime.now())
                .build();

        assertDoesNotThrow(() -> stockUpdatePublisher.publishStockUpdate(event2));
    }

    @Test
    void testPublishStockUpdate_InvalidProductId_ThrowsException() {
        StockUpdateEvent invalidEvent = StockUpdateEvent.builder()
                .productId(0L)
                .warehouseId(1L)
                .previousQuantity(100)
                .newQuantity(90)
                .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
                .timestamp(LocalDateTime.now())
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockUpdatePublisher.publishStockUpdate(invalidEvent));

        assertTrue(exception.getMessage().contains("Invalid productId"));
    }

    @Test
    void testPublishStockUpdate_NullProductId_ThrowsException() {
        StockUpdateEvent invalidEvent = StockUpdateEvent.builder()
                .productId(null)
                .warehouseId(1L)
                .previousQuantity(100)
                .newQuantity(90)
                .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
                .timestamp(LocalDateTime.now())
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockUpdatePublisher.publishStockUpdate(invalidEvent));

        assertTrue(exception.getMessage().contains("Invalid productId"));
    }

    @Test
    void testPublishStockUpdate_InvalidWarehouseId_ThrowsException() {
        StockUpdateEvent invalidEvent = StockUpdateEvent.builder()
                .productId(1L)
                .warehouseId(0L)
                .previousQuantity(100)
                .newQuantity(90)
                .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
                .timestamp(LocalDateTime.now())
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockUpdatePublisher.publishStockUpdate(invalidEvent));

        assertTrue(exception.getMessage().contains("Invalid warehouseId"));
    }

    @Test
    void testPublishStockUpdate_NullWarehouseId_ThrowsException() {
        StockUpdateEvent invalidEvent = StockUpdateEvent.builder()
                .productId(1L)
                .warehouseId(null)
                .previousQuantity(100)
                .newQuantity(90)
                .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
                .timestamp(LocalDateTime.now())
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockUpdatePublisher.publishStockUpdate(invalidEvent));

        assertTrue(exception.getMessage().contains("Invalid warehouseId"));
    }

    @Test
    void testPublishStockUpdate_InvalidPreviousQuantity_ThrowsException() {
        StockUpdateEvent invalidEvent = StockUpdateEvent.builder()
                .productId(1L)
                .warehouseId(1L)
                .previousQuantity(-1)
                .newQuantity(90)
                .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
                .timestamp(LocalDateTime.now())
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockUpdatePublisher.publishStockUpdate(invalidEvent));

        assertTrue(exception.getMessage().contains("Invalid previousQuantity"));
    }

    @Test
    void testPublishStockUpdate_InvalidNewQuantity_ThrowsException() {
        StockUpdateEvent invalidEvent = StockUpdateEvent.builder()
                .productId(1L)
                .warehouseId(1L)
                .previousQuantity(100)
                .newQuantity(-1)
                .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
                .timestamp(LocalDateTime.now())
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockUpdatePublisher.publishStockUpdate(invalidEvent));

        assertTrue(exception.getMessage().contains("Invalid newQuantity"));
    }

    @Test
    void testPublishLowStockAlert_HappyPath() {
        assertDoesNotThrow(() -> stockUpdatePublisher.publishLowStockAlert(testProduct, 1L));
    }

    @Test
    void testPublishLowStockAlert_DifferentWarehouse() {
        assertDoesNotThrow(() -> stockUpdatePublisher.publishLowStockAlert(testProduct, 2L));
    }

    @Test
    void testPublishLowStockAlert_NullProduct_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockUpdatePublisher.publishLowStockAlert(null, 1L));

        assertTrue(exception.getMessage().contains("Invalid product"));
    }

    @Test
    void testPublishLowStockAlert_InvalidProductId_ThrowsException() {
        testProduct.setId(0L);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockUpdatePublisher.publishLowStockAlert(testProduct, 1L));

        assertTrue(exception.getMessage().contains("Invalid product"));
    }

    @Test
    void testPublishLowStockAlert_NullProductId_ThrowsException() {
        testProduct.setId(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockUpdatePublisher.publishLowStockAlert(testProduct, 1L));

        assertTrue(exception.getMessage().contains("Invalid product"));
    }

    @Test
    void testPublishLowStockAlert_InvalidWarehouseId_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockUpdatePublisher.publishLowStockAlert(testProduct, 0L));

        assertTrue(exception.getMessage().contains("Invalid warehouseId"));
    }

    @Test
    void testPublishLowStockAlert_NegativeWarehouseId_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> stockUpdatePublisher.publishLowStockAlert(testProduct, -1L));

        assertTrue(exception.getMessage().contains("Invalid warehouseId"));
    }
}
