package com.retailr.catalog.repository;

import com.retailr.catalog.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class StockItemRepositoryTest {
    @Autowired
    private StockItemRepository stockItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    private Product testProduct;
    private Warehouse testWarehouse;
    private StockItem testStockItem;

    @BeforeEach
    void setUp() {
        // Create test category
        Category testCategory = categoryRepository.save(Category.builder()
            .name("Electronics")
            .description("Electronic goods")
            .build());

        // Create test product
        testProduct = productRepository.save(Product.builder()
            .sku("PROD-001")
            .name("Laptop")
            .description("High-performance laptop")
            .unitPrice(new BigDecimal("999.99"))
            .category(testCategory)
            .lowStockThreshold(10)
            .build());

        // Create test warehouse
        testWarehouse = warehouseRepository.save(Warehouse.builder()
            .name("Main Warehouse")
            .location("New York")
            .build());

        // Create test stock item
        testStockItem = StockItem.builder()
            .product(testProduct)
            .warehouse(testWarehouse)
            .quantity(100)
            .reservedQuantity(20)
            .build();
    }

    @Test
    void testSaveStockItem() {
        StockItem saved = stockItemRepository.save(testStockItem);
        assertNotNull(saved.getId());
        assertEquals(100, saved.getQuantity());
        assertEquals(20, saved.getReservedQuantity());
    }

    @Test
    void testFindByProductId() {
        stockItemRepository.save(testStockItem);
        List<StockItem> items = stockItemRepository.findByProduct_Id(testProduct.getId());
        assertEquals(1, items.size());
        assertEquals(testWarehouse.getId(), items.get(0).getWarehouse().getId());
    }

    @Test
    void testFindByWarehouseId() {
        stockItemRepository.save(testStockItem);
        List<StockItem> items = stockItemRepository.findByWarehouse_Id(testWarehouse.getId());
        assertEquals(1, items.size());
        assertEquals(testProduct.getId(), items.get(0).getProduct().getId());
    }

    @Test
    void testFindByProductIdAndWarehouseId() {
        stockItemRepository.save(testStockItem);
        var found = stockItemRepository.findByProductIdAndWarehouseId(testProduct.getId(), testWarehouse.getId());
        assertTrue(found.isPresent());
        assertEquals(100, found.get().getQuantity());
    }

    @Test
    void testGetAvailableQuantity() {
        StockItem saved = stockItemRepository.save(testStockItem);
        assertEquals(80, saved.getAvailableQuantity());
    }
}
