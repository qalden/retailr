package com.retailr.catalog.service;

import com.retailr.catalog.dto.CreateStockMovementRequest;
import com.retailr.catalog.dto.StockItemDTO;
import com.retailr.catalog.dto.StockMovementDTO;
import com.retailr.catalog.entity.Category;
import com.retailr.catalog.entity.Product;
import com.retailr.catalog.entity.StockItem;
import com.retailr.catalog.entity.Warehouse;
import com.retailr.catalog.repository.CategoryRepository;
import com.retailr.catalog.repository.ProductRepository;
import com.retailr.catalog.repository.StockItemRepository;
import com.retailr.catalog.repository.StockMovementRepository;
import com.retailr.catalog.repository.LowStockAlertRepository;
import com.retailr.catalog.repository.WarehouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StockServiceTest {
    @Autowired
    private StockService stockService;

    @Autowired
    private StockItemRepository stockItemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private LowStockAlertRepository lowStockAlertRepository;

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
        testStockItem = stockItemRepository.save(StockItem.builder()
            .product(testProduct)
            .warehouse(testWarehouse)
            .quantity(100)
            .reservedQuantity(20)
            .build());
    }

    @Test
    void testGetStockItem_HappyPath() {
        StockItemDTO dto = stockService.getStockItem(testStockItem.getId());

        assertNotNull(dto);
        assertEquals(testStockItem.getId(), dto.getId());
        assertEquals(testProduct.getId(), dto.getProductId());
        assertEquals(testWarehouse.getId(), dto.getWarehouseId());
        assertEquals(100, dto.getQuantity());
        assertEquals(20, dto.getReservedQuantity());
        assertEquals(80, dto.getAvailableQuantity());
    }

    @Test
    void testGetStockByProduct() {
        List<StockItemDTO> items = stockService.getStockByProduct(testProduct.getId());

        assertNotNull(items);
        assertEquals(1, items.size());
        assertEquals(testStockItem.getId(), items.get(0).getId());
    }

    @Test
    void testGetStockByWarehouse() {
        List<StockItemDTO> items = stockService.getStockByWarehouse(testWarehouse.getId());

        assertNotNull(items);
        assertEquals(1, items.size());
        assertEquals(testStockItem.getId(), items.get(0).getId());
    }

    @Test
    void testReserveStock_SufficientInventory() {
        int quantityToReserve = 30;
        stockService.reserveStock(testStockItem.getId(), quantityToReserve);

        StockItem updated = stockItemRepository.findById(testStockItem.getId()).orElseThrow();
        assertEquals(50, updated.getReservedQuantity());
        assertEquals(50, updated.getAvailableQuantity());
    }

    @Test
    void testReserveStock_InsufficientInventory() {
        int quantityToReserve = 100;

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> stockService.reserveStock(testStockItem.getId(), quantityToReserve));

        assertTrue(exception.getMessage().contains("Insufficient stock available"));
    }

    @Test
    void testRecordMovement() {
        CreateStockMovementRequest request = CreateStockMovementRequest.builder()
            .stockItemId(testStockItem.getId())
            .quantityDelta(50)
            .movementType("PURCHASE")
            .referenceType("PO")
            .referenceId(123L)
            .build();

        StockMovementDTO dto = stockService.recordMovement(request);

        assertNotNull(dto);
        assertNotNull(dto.getId());
        assertEquals(testStockItem.getId(), dto.getStockItemId());
        assertEquals(50, dto.getQuantityDelta());
        assertEquals("PURCHASE", dto.getMovementType());
        assertEquals("PO", dto.getReferenceType());
        assertEquals(123L, dto.getReferenceId());
    }
}
