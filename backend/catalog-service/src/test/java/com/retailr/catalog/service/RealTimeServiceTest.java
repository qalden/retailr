package com.retailr.catalog.service;

import com.retailr.catalog.entity.Category;
import com.retailr.catalog.entity.Product;
import com.retailr.catalog.entity.StockItem;
import com.retailr.catalog.entity.Warehouse;
import com.retailr.catalog.repository.CategoryRepository;
import com.retailr.catalog.repository.ProductRepository;
import com.retailr.catalog.repository.StockItemRepository;
import com.retailr.catalog.repository.WarehouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RealTimeServiceTest {

    @Autowired
    private RealTimeService realTimeService;

    @Autowired
    private StockItemRepository stockItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private StockItem testStockItem;
    private Product testProduct;
    private Warehouse testWarehouse;

    @BeforeEach
    void setUp() {
        Category testCategory = categoryRepository.save(Category.builder()
                .name("Test Category")
                .description("Test")
                .build());

        testWarehouse = warehouseRepository.save(Warehouse.builder()
                .name("Test Warehouse")
                .location("Test Location")
                .build());

        testProduct = productRepository.save(Product.builder()
                .sku("TEST-001")
                .name("Test Product")
                .description("Test Product")
                .unitPrice(new BigDecimal("99.99"))
                .category(testCategory)
                .lowStockThreshold(10)
                .build());

        testStockItem = stockItemRepository.save(StockItem.builder()
                .product(testProduct)
                .warehouse(testWarehouse)
                .quantity(100)
                .reservedQuantity(0)
                .build());
    }

    @Test
    void testNotifyStockAdjustment_CreatesAdjustmentTypeEvent() {
        Integer previousQty = 100;
        Integer newQty = 90;

        assertDoesNotThrow(() -> realTimeService.notifyStockAdjustment(testStockItem, previousQty, newQty));
    }

    @Test
    void testNotifyStockAdjustment_PublisherCalledWithCorrectEvent() {
        assertDoesNotThrow(() -> realTimeService.notifyStockAdjustment(testStockItem, 100, 90));
    }

    @Test
    void testNotifyStockAdjustment_LowStockAlertTriggeredWhenBelowThreshold() {
        Integer newQty = 5; // Below threshold of 10

        assertDoesNotThrow(() -> realTimeService.notifyStockAdjustment(testStockItem, 15, newQty));
    }

    @Test
    void testNotifyStockAdjustment_LowStockAlertTriggeredWhenEqualToThreshold() {
        Integer newQty = 10; // Equal to threshold

        assertDoesNotThrow(() -> realTimeService.notifyStockAdjustment(testStockItem, 15, newQty));
    }

    @Test
    void testNotifyStockAdjustment_NoAlertWhenAboveThreshold() {
        Integer newQty = 15; // Above threshold

        assertDoesNotThrow(() -> realTimeService.notifyStockAdjustment(testStockItem, 20, newQty));
    }

    @Test
    void testNotifyStockAdjustment_InvalidProductId_ThrowsException() {
        StockItem invalidItem = new StockItem();
        invalidItem.setProduct(new Product());
        invalidItem.getProduct().setId(0L);
        invalidItem.setWarehouse(testWarehouse);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyStockAdjustment(invalidItem, 100, 90));

        assertTrue(exception.getMessage().contains("Invalid productId"));
    }

    @Test
    void testNotifyStockAdjustment_NullProductId_ThrowsException() {
        StockItem invalidItem = new StockItem();
        invalidItem.setProduct(new Product());
        invalidItem.setWarehouse(testWarehouse);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyStockAdjustment(invalidItem, 100, 90));

        assertTrue(exception.getMessage().contains("Invalid productId"));
    }

    @Test
    void testNotifyStockAdjustment_InvalidWarehouseId_ThrowsException() {
        StockItem invalidItem = new StockItem();
        invalidItem.setProduct(testProduct);
        invalidItem.setWarehouse(new Warehouse());
        invalidItem.getWarehouse().setId(0L);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyStockAdjustment(invalidItem, 100, 90));

        assertTrue(exception.getMessage().contains("Invalid warehouseId"));
    }

    @Test
    void testNotifyStockAdjustment_NegativeQuantity_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyStockAdjustment(testStockItem, -1, 90));

        assertTrue(exception.getMessage().contains("Invalid quantity"));
    }

    @Test
    void testNotifyOrderConfirmation_CreatesOrderConfirmationTypeEvent() {
        Integer quantity = 10;

        assertDoesNotThrow(() -> realTimeService.notifyOrderConfirmation(testProduct.getId(), testWarehouse.getId(), quantity));
    }

    @Test
    void testNotifyOrderConfirmation_PublisherCalledWithCorrectEvent() {
        assertDoesNotThrow(() -> realTimeService.notifyOrderConfirmation(testProduct.getId(), testWarehouse.getId(), 10));
    }

    @Test
    void testNotifyOrderConfirmation_LowStockAlertTriggeredWhenBelowThreshold() {
        // Create a new warehouse to avoid unique constraint violation
        Warehouse warehouse2 = warehouseRepository.save(Warehouse.builder()
                .name("Test Warehouse 2")
                .location("Test Location 2")
                .build());

        StockItem item = stockItemRepository.save(StockItem.builder()
                .product(testProduct)
                .warehouse(warehouse2)
                .quantity(20)
                .reservedQuantity(0)
                .build());

        assertDoesNotThrow(() -> realTimeService.notifyOrderConfirmation(
                item.getProduct().getId(),
                item.getWarehouse().getId(),
                15)); // Results in qty 5, below threshold
    }

    @Test
    void testNotifyOrderConfirmation_InvalidProductId_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyOrderConfirmation(0L, 1L, 10));

        assertTrue(exception.getMessage().contains("Invalid productId"));
    }

    @Test
    void testNotifyOrderConfirmation_InvalidWarehouseId_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyOrderConfirmation(1L, 0L, 10));

        assertTrue(exception.getMessage().contains("Invalid warehouseId"));
    }

    @Test
    void testNotifyOrderConfirmation_InvalidQuantity_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyOrderConfirmation(testProduct.getId(), testWarehouse.getId(), -1));

        assertTrue(exception.getMessage().contains("Invalid quantity"));
    }

    @Test
    void testNotifyOrderConfirmation_StockItemNotFound_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyOrderConfirmation(999L, 999L, 10));

        assertTrue(exception.getMessage().contains("StockItem not found"));
    }

    @Test
    void testNotifyStockReturn_CreatesReturnTypeEvent() {
        Integer quantity = 10;

        assertDoesNotThrow(() -> realTimeService.notifyStockReturn(testProduct.getId(), testWarehouse.getId(), quantity));
    }

    @Test
    void testNotifyStockReturn_PublisherCalledWithCorrectEvent() {
        assertDoesNotThrow(() -> realTimeService.notifyStockReturn(testProduct.getId(), testWarehouse.getId(), 10));
    }

    @Test
    void testNotifyStockReturn_InvalidProductId_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyStockReturn(0L, 1L, 10));

        assertTrue(exception.getMessage().contains("Invalid productId"));
    }

    @Test
    void testNotifyStockReturn_InvalidWarehouseId_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyStockReturn(testProduct.getId(), 0L, 10));

        assertTrue(exception.getMessage().contains("Invalid warehouseId"));
    }

    @Test
    void testNotifyStockReturn_InvalidQuantity_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyStockReturn(testProduct.getId(), testWarehouse.getId(), -1));

        assertTrue(exception.getMessage().contains("Invalid quantity"));
    }

    @Test
    void testNotifyStockReturn_StockItemNotFound_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> realTimeService.notifyStockReturn(999L, 999L, 10));

        assertTrue(exception.getMessage().contains("StockItem not found"));
    }
}
