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
class StockMovementRepositoryTest {
    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private StockItemRepository stockItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    private StockItem testStockItem;
    private Product testProduct;
    private Warehouse testWarehouse;

    @BeforeEach
    void setUp() {
        // Create test category
        Category testCategory = categoryRepository.save(Category.builder()
            .name("Electronics")
            .description("Electronic goods")
            .build());

        // Create test product
        testProduct = productRepository.save(Product.builder()
            .sku("PROD-002")
            .name("Monitor")
            .description("4K Monitor")
            .unitPrice(new BigDecimal("499.99"))
            .category(testCategory)
            .lowStockThreshold(5)
            .build());

        // Create test warehouse
        testWarehouse = warehouseRepository.save(Warehouse.builder()
            .name("Warehouse A")
            .location("Los Angeles")
            .build());

        // Create test stock item
        testStockItem = stockItemRepository.save(StockItem.builder()
            .product(testProduct)
            .warehouse(testWarehouse)
            .quantity(50)
            .reservedQuantity(10)
            .build());
    }

    @Test
    void testSaveStockMovement() {
        StockMovement movement = StockMovement.builder()
            .stockItem(testStockItem)
            .quantityDelta(10)
            .movementType("IN")
            .referenceType("ORDER")
            .referenceId(1001L)
            .createdByUserId(100L)
            .build();

        StockMovement saved = stockMovementRepository.save(movement);
        assertNotNull(saved.getId());
        assertEquals(10, saved.getQuantityDelta());
        assertEquals("IN", saved.getMovementType());
        assertEquals("ORDER", saved.getReferenceType());
        assertEquals(1001L, saved.getReferenceId());
        assertEquals(100L, saved.getCreatedByUserId());
    }

    @Test
    void testFindByStockItemIdOrderByCreatedAtDesc() throws InterruptedException {
        // Create first movement
        StockMovement movement1 = StockMovement.builder()
            .stockItem(testStockItem)
            .quantityDelta(10)
            .movementType("IN")
            .referenceType("ORDER")
            .referenceId(1001L)
            .build();
        stockMovementRepository.save(movement1);

        // Add small delay to ensure different timestamps
        Thread.sleep(100);

        // Create second movement
        StockMovement movement2 = StockMovement.builder()
            .stockItem(testStockItem)
            .quantityDelta(-5)
            .movementType("OUT")
            .referenceType("SALE")
            .referenceId(2001L)
            .build();
        stockMovementRepository.save(movement2);

        List<StockMovement> movements = stockMovementRepository.findByStockItem_IdOrderByCreatedAtDesc(testStockItem.getId());
        assertEquals(2, movements.size());
        // Verify they are ordered DESC (most recent first)
        assertEquals(-5, movements.get(0).getQuantityDelta());
        assertEquals(10, movements.get(1).getQuantityDelta());
    }

    @Test
    void testFindByMovementType() {
        // Create multiple movements with different types
        StockMovement inMovement = StockMovement.builder()
            .stockItem(testStockItem)
            .quantityDelta(20)
            .movementType("IN")
            .build();
        stockMovementRepository.save(inMovement);

        StockMovement outMovement = StockMovement.builder()
            .stockItem(testStockItem)
            .quantityDelta(-5)
            .movementType("OUT")
            .build();
        stockMovementRepository.save(outMovement);

        StockMovement adjustmentMovement = StockMovement.builder()
            .stockItem(testStockItem)
            .quantityDelta(-2)
            .movementType("ADJUSTMENT")
            .build();
        stockMovementRepository.save(adjustmentMovement);

        List<StockMovement> inMovements = stockMovementRepository.findByMovementType("IN");
        assertEquals(1, inMovements.size());
        assertEquals("IN", inMovements.get(0).getMovementType());
    }

    @Test
    void testStockMovementForeignKeyConstraint() {
        // Verify that stock movement is properly linked to stock item
        StockMovement movement = StockMovement.builder()
            .stockItem(testStockItem)
            .quantityDelta(5)
            .movementType("ADJUSTMENT")
            .build();

        StockMovement saved = stockMovementRepository.save(movement);
        assertNotNull(saved.getId());
        assertEquals(testStockItem.getId(), saved.getStockItem().getId());
    }

    @Test
    void testStockMovementCreatedAtIsSet() {
        LocalDateTime before = LocalDateTime.now();

        StockMovement movement = StockMovement.builder()
            .stockItem(testStockItem)
            .quantityDelta(15)
            .movementType("IN")
            .build();

        StockMovement saved = stockMovementRepository.save(movement);
        LocalDateTime after = LocalDateTime.now();

        assertNotNull(saved.getCreatedAt());
        assertTrue(saved.getCreatedAt().isAfter(before) || saved.getCreatedAt().isEqual(before));
        assertTrue(saved.getCreatedAt().isBefore(after) || saved.getCreatedAt().isEqual(after));
    }
}
