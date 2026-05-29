package com.retailr.catalog.service;

import com.retailr.catalog.dto.CreateProductRequest;
import com.retailr.catalog.dto.ProductDTO;
import com.retailr.catalog.dto.UpdateProductRequest;
import com.retailr.catalog.entity.Category;
import com.retailr.catalog.entity.Product;
import com.retailr.catalog.repository.CategoryRepository;
import com.retailr.catalog.repository.ProductRepository;
import com.retailr.catalog.repository.ProductSupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ProductServiceTest {
    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductSupplierRepository productSupplierRepository;

    private Category testCategory;

    @BeforeEach
    void setUp() {
        testCategory = Category.builder()
            .name("Electronics")
            .description("Electronic products")
            .build();
        categoryRepository.save(testCategory);
    }

    @Test
    void testCreateProduct_Success() {
        CreateProductRequest request = CreateProductRequest.builder()
            .sku("SKU-123")
            .name("Test Product")
            .description("A test product")
            .categoryId(testCategory.getId())
            .unitPrice(BigDecimal.valueOf(99.99))
            .lowStockThreshold(10)
            .build();

        ProductDTO result = productService.createProduct(request);

        assertNotNull(result.getId());
        assertEquals("SKU-123", result.getSku());
        assertEquals("Test Product", result.getName());
        assertEquals("A test product", result.getDescription());
        assertEquals(testCategory.getId(), result.getCategoryId());
        assertEquals("Electronics", result.getCategoryName());
        assertEquals(BigDecimal.valueOf(99.99), result.getUnitPrice());
        assertEquals(10, result.getLowStockThreshold());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());
    }

    @Test
    void testCreateProduct_InvalidCategory() {
        CreateProductRequest request = CreateProductRequest.builder()
            .sku("SKU-456")
            .name("Another Product")
            .categoryId(999L)
            .unitPrice(BigDecimal.valueOf(49.99))
            .lowStockThreshold(5)
            .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> productService.createProduct(request));

        assertTrue(exception.getMessage().contains("Category not found"));
    }

    @Test
    void testGetProduct_Success() {
        Product product = Product.builder()
            .sku("PROD-001")
            .name("Laptop")
            .description("High-performance laptop")
            .unitPrice(BigDecimal.valueOf(999.99))
            .category(testCategory)
            .lowStockThreshold(5)
            .build();
        Product saved = productRepository.save(product);

        ProductDTO result = productService.getProduct(saved.getId());

        assertNotNull(result);
        assertEquals(saved.getId(), result.getId());
        assertEquals("PROD-001", result.getSku());
        assertEquals("Laptop", result.getName());
        assertEquals("High-performance laptop", result.getDescription());
        assertEquals(testCategory.getId(), result.getCategoryId());
        assertEquals("Electronics", result.getCategoryName());
        assertEquals(BigDecimal.valueOf(999.99), result.getUnitPrice());
        assertEquals(5, result.getLowStockThreshold());
    }

    @Test
    void testGetProduct_NotFound() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> productService.getProduct(999L));

        assertTrue(exception.getMessage().contains("Product not found"));
    }

    @Test
    void testListProducts_Success() {
        Product product1 = Product.builder()
            .sku("PROD-001")
            .name("Product 1")
            .description("Description 1")
            .unitPrice(BigDecimal.valueOf(10.00))
            .category(testCategory)
            .lowStockThreshold(5)
            .build();
        Product product2 = Product.builder()
            .sku("PROD-002")
            .name("Product 2")
            .description("Description 2")
            .unitPrice(BigDecimal.valueOf(20.00))
            .category(testCategory)
            .lowStockThreshold(10)
            .build();
        productRepository.save(product1);
        productRepository.save(product2);

        Pageable pageable = PageRequest.of(0, 10);
        Page<ProductDTO> result = productService.listProducts(pageable);

        assertNotNull(result);
        assertTrue(result.getContent().size() >= 2);
        assertTrue(result.getContent().stream().anyMatch(p -> "PROD-001".equals(p.getSku())));
        assertTrue(result.getContent().stream().anyMatch(p -> "PROD-002".equals(p.getSku())));
    }

    @Test
    void testListProductsByCategory_Success() {
        Category otherCategory = Category.builder()
            .name("Furniture")
            .description("Furniture products")
            .build();
        categoryRepository.save(otherCategory);

        Product product1 = Product.builder()
            .sku("ELEC-001")
            .name("Electronic Product")
            .description("An electronic item")
            .unitPrice(BigDecimal.valueOf(100.00))
            .category(testCategory)
            .lowStockThreshold(5)
            .build();
        Product product2 = Product.builder()
            .sku("FURN-001")
            .name("Furniture Item")
            .description("A furniture item")
            .unitPrice(BigDecimal.valueOf(200.00))
            .category(otherCategory)
            .lowStockThreshold(10)
            .build();
        productRepository.save(product1);
        productRepository.save(product2);

        Pageable pageable = PageRequest.of(0, 10);
        Page<ProductDTO> result = productService.listProductsByCategory(testCategory.getId(), pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("Electronic Product", result.getContent().get(0).getName());
        assertEquals(testCategory.getId(), result.getContent().get(0).getCategoryId());
    }

    @Test
    void testUpdateProduct_Success() {
        Product product = Product.builder()
            .sku("PROD-001")
            .name("Original Name")
            .description("Original Description")
            .unitPrice(BigDecimal.valueOf(50.00))
            .category(testCategory)
            .lowStockThreshold(5)
            .build();
        Product saved = productRepository.save(product);

        UpdateProductRequest request = UpdateProductRequest.builder()
            .name("Updated Name")
            .description("Updated Description")
            .unitPrice(BigDecimal.valueOf(75.00))
            .lowStockThreshold(15)
            .build();

        ProductDTO result = productService.updateProduct(saved.getId(), request);

        assertEquals("Updated Name", result.getName());
        assertEquals("Updated Description", result.getDescription());
        assertEquals(BigDecimal.valueOf(75.00), result.getUnitPrice());
        assertEquals(15, result.getLowStockThreshold());
    }

    @Test
    void testDeleteProduct_Success() {
        Product product = Product.builder()
            .sku("PROD-001")
            .name("To Delete")
            .description("This will be deleted")
            .unitPrice(BigDecimal.valueOf(10.00))
            .category(testCategory)
            .lowStockThreshold(5)
            .build();
        Product saved = productRepository.save(product);
        Long productId = saved.getId();

        productService.deleteProduct(productId);

        assertFalse(productRepository.existsById(productId));
    }
}
