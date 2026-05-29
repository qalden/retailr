package com.retailr.catalog.repository;

import com.retailr.catalog.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class LowStockAlertRepositoryTest {
    @Autowired
    private LowStockAlertRepository lowStockAlertRepository;

    @Autowired
    private StockItemRepository stockItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private StockItem testStockItem;

    @BeforeEach
    void setUp() {
        Category category = categoryRepository.save(Category.builder()
            .name("Test Category")
            .description("Test")
            .build());

        Product product = productRepository.save(Product.builder()
            .sku("TEST-SKU")
            .name("Test Product")
            .description("Test Product Description")
            .unitPrice(BigDecimal.valueOf(100))
            .category(category)
            .lowStockThreshold(5)
            .build());

        Warehouse warehouse = warehouseRepository.save(Warehouse.builder()
            .name("Test Warehouse")
            .location("Test")
            .build());

        testStockItem = stockItemRepository.save(StockItem.builder()
            .product(product)
            .warehouse(warehouse)
            .quantity(0)
            .reservedQuantity(0)
            .build());
    }

    @Test
    void testSaveLowStockAlert() {
        LowStockAlert alert = LowStockAlert.builder()
            .stockItem(testStockItem)
            .build();

        LowStockAlert saved = lowStockAlertRepository.save(alert);

        assertNotNull(saved.getId());
        assertEquals(testStockItem.getId(), saved.getStockItem().getId());
        assertNotNull(saved.getTriggeredAt());
        assertNull(saved.getAcknowledgedAt());
    }

    @Test
    void testFindByStockItemId() {
        lowStockAlertRepository.save(LowStockAlert.builder()
            .stockItem(testStockItem)
            .build());

        List<LowStockAlert> alerts = lowStockAlertRepository.findByStockItem_Id(testStockItem.getId());

        assertEquals(1, alerts.size());
        assertEquals(testStockItem.getId(), alerts.get(0).getStockItem().getId());
    }

    @Test
    void testFindUnacknowledgedAlerts() {
        LowStockAlert unacknowledged = lowStockAlertRepository.save(LowStockAlert.builder()
            .stockItem(testStockItem)
            .build());

        LowStockAlert acknowledged = lowStockAlertRepository.save(LowStockAlert.builder()
            .stockItem(testStockItem)
            .acknowledgedAt(LocalDateTime.now())
            .build());

        List<LowStockAlert> unacknowledgedAlerts = lowStockAlertRepository.findUnacknowledgedAlerts();

        assertTrue(unacknowledgedAlerts.stream()
            .anyMatch(a -> a.getId().equals(unacknowledged.getId())));
        assertFalse(unacknowledgedAlerts.stream()
            .anyMatch(a -> a.getId().equals(acknowledged.getId())));
    }
}
