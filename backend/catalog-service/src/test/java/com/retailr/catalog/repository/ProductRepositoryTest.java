package com.retailr.catalog.repository;

import com.retailr.catalog.entity.Category;
import com.retailr.catalog.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class ProductRepositoryTest {
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private Category testCategory;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testCategory = categoryRepository.save(Category.builder()
            .name("Electronics")
            .description("Electronic goods")
            .build());

        testProduct = Product.builder()
            .sku("PROD-001")
            .name("Laptop")
            .description("High-performance laptop")
            .unitPrice(new BigDecimal("999.99"))
            .category(testCategory)
            .lowStockThreshold(10)
            .build();
    }

    @Test
    void testSaveProduct() {
        Product saved = productRepository.save(testProduct);
        assertNotNull(saved.getId());
        assertEquals("PROD-001", saved.getSku());
    }

    @Test
    void testFindBySku() {
        productRepository.save(testProduct);
        var found = productRepository.findBySku("PROD-001");
        assertTrue(found.isPresent());
        assertEquals("Laptop", found.get().getName());
    }

    @Test
    void testFindByCategory() {
        productRepository.save(testProduct);
        Page<Product> result = productRepository.findByCategory_Id(testCategory.getId(), PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
        assertEquals("Laptop", result.getContent().get(0).getName());
    }

    @Test
    void testSearchByNameOrSku() {
        productRepository.save(testProduct);
        Page<Product> results = productRepository.searchByNameOrSku("Laptop", PageRequest.of(0, 10));
        assertEquals(1, results.getTotalElements());
        assertEquals("PROD-001", results.getContent().get(0).getSku());
    }

    @Test
    void testFindBySkuNotFound() {
        var found = productRepository.findBySku("NON-EXISTENT");
        assertTrue(found.isEmpty());
    }
}
