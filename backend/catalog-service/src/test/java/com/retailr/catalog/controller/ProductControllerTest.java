package com.retailr.catalog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailr.catalog.dto.CategoryDTO;
import com.retailr.catalog.dto.CreateProductRequest;
import com.retailr.catalog.dto.ProductDTO;
import com.retailr.catalog.dto.UpdateProductRequest;
import com.retailr.catalog.exception.GlobalExceptionHandler;
import com.retailr.catalog.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProductControllerTest {
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private StubProductService stubProductService;

    @BeforeEach
    void setUp() {
        stubProductService = new StubProductService();
        ProductController controller = new ProductController(stubProductService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testCreateProduct_Success() throws Exception {
        CreateProductRequest request = CreateProductRequest.builder()
            .sku("SKU123")
            .name("Test Product")
            .description("A test product")
            .categoryId(1L)
            .unitPrice(new BigDecimal("99.99"))
            .lowStockThreshold(10)
            .build();

        ProductDTO responseDto = ProductDTO.builder()
            .id(1L)
            .sku("SKU123")
            .name("Test Product")
            .description("A test product")
            .categoryId(1L)
            .categoryName("Electronics")
            .unitPrice(new BigDecimal("99.99"))
            .lowStockThreshold(10)
            .supplierIds(new ArrayList<>())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        stubProductService.setupCreateProduct(responseDto);

        mockMvc.perform(post("/api/v1/products")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.sku").value("SKU123"))
            .andExpect(jsonPath("$.name").value("Test Product"));
    }

    @Test
    void testCreateProduct_InvalidCategory() throws Exception {
        CreateProductRequest request = CreateProductRequest.builder()
            .sku("SKU123")
            .name("Test Product")
            .description("A test product")
            .categoryId(999L)
            .unitPrice(new BigDecimal("99.99"))
            .lowStockThreshold(10)
            .build();

        stubProductService.setupThrowException(new IllegalArgumentException("Category not found: 999"));

        mockMvc.perform(post("/api/v1/products")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Category not found: 999"));
    }

    @Test
    void testCreateProduct_ValidationError() throws Exception {
        CreateProductRequest request = CreateProductRequest.builder()
            .sku("") // Invalid: blank
            .name("Test Product")
            .description("A test product")
            .categoryId(1L)
            .unitPrice(new BigDecimal("99.99"))
            .lowStockThreshold(10)
            .build();

        mockMvc.perform(post("/api/v1/products")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void testGetProduct_Success() throws Exception {
        ProductDTO responseDto = ProductDTO.builder()
            .id(1L)
            .sku("SKU123")
            .name("Test Product")
            .description("A test product")
            .categoryId(1L)
            .categoryName("Electronics")
            .unitPrice(new BigDecimal("99.99"))
            .lowStockThreshold(10)
            .supplierIds(new ArrayList<>())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        stubProductService.setupGetProduct(1L, responseDto);

        mockMvc.perform(get("/api/v1/products/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.sku").value("SKU123"))
            .andExpect(jsonPath("$.name").value("Test Product"));
    }

    @Test
    void testGetProduct_NotFound() throws Exception {
        stubProductService.setupThrowException(new IllegalArgumentException("Product not found: 999"));

        mockMvc.perform(get("/api/v1/products/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Product not found: 999"));
    }

    @Test
    void testListProducts_Success() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            ProductDTO.builder()
                .id(1L)
                .sku("SKU001")
                .name("Product 1")
                .categoryId(1L)
                .categoryName("Electronics")
                .unitPrice(new BigDecimal("99.99"))
                .lowStockThreshold(10)
                .supplierIds(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build(),
            ProductDTO.builder()
                .id(2L)
                .sku("SKU002")
                .name("Product 2")
                .categoryId(1L)
                .categoryName("Electronics")
                .unitPrice(new BigDecimal("149.99"))
                .lowStockThreshold(5)
                .supplierIds(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build()
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 2);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].id").value(1))
            .andExpect(jsonPath("$.content[1].id").value(2));
    }

    @Test
    void testListActiveProducts_Success() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            ProductDTO.builder()
                .id(1L)
                .sku("SKU001")
                .name("Product 1")
                .categoryId(1L)
                .categoryName("Electronics")
                .unitPrice(new BigDecimal("99.99"))
                .lowStockThreshold(10)
                .supplierIds(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build()
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 1);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products/active")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    void testListProductsByCategory_Success() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            ProductDTO.builder()
                .id(1L)
                .sku("SKU001")
                .name("Product 1")
                .categoryId(1L)
                .categoryName("Electronics")
                .unitPrice(new BigDecimal("99.99"))
                .lowStockThreshold(10)
                .supplierIds(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build()
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 1);
        stubProductService.setupListProductsByCategory(page);

        mockMvc.perform(get("/api/v1/products/category/1")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].categoryId").value(1));
    }

    @Test
    void testListProductsByCategory_NotFound() throws Exception {
        stubProductService.setupThrowException(new IllegalArgumentException("Category not found: 999"));

        mockMvc.perform(get("/api/v1/products/category/999")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Category not found: 999"));
    }

    @Test
    void testUpdateProduct_Success() throws Exception {
        UpdateProductRequest request = UpdateProductRequest.builder()
            .name("Updated Product")
            .unitPrice(new BigDecimal("129.99"))
            .build();

        ProductDTO responseDto = ProductDTO.builder()
            .id(1L)
            .sku("SKU123")
            .name("Updated Product")
            .description("A test product")
            .categoryId(1L)
            .categoryName("Electronics")
            .unitPrice(new BigDecimal("129.99"))
            .lowStockThreshold(10)
            .supplierIds(new ArrayList<>())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        stubProductService.setupUpdateProduct(responseDto);

        mockMvc.perform(put("/api/v1/products/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Updated Product"))
            .andExpect(jsonPath("$.unitPrice").value(129.99));
    }

    @Test
    void testUpdateProduct_NotFound() throws Exception {
        UpdateProductRequest request = UpdateProductRequest.builder()
            .name("Updated Product")
            .build();

        stubProductService.setupThrowException(new IllegalArgumentException("Product not found: 999"));

        mockMvc.perform(put("/api/v1/products/999")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Product not found: 999"));
    }

    @Test
    void testDeleteProduct_Success() throws Exception {
        stubProductService.setupDeleteSuccess();

        mockMvc.perform(delete("/api/v1/products/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    void testDeleteProduct_NotFound() throws Exception {
        stubProductService.setupThrowException(new IllegalArgumentException("Product not found: 999"));

        mockMvc.perform(delete("/api/v1/products/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Product not found: 999"));
    }

    @Test
    void testGetProductsBySupplier_Success() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            ProductDTO.builder()
                .id(1L)
                .sku("SKU001")
                .name("Product 1")
                .categoryId(1L)
                .categoryName("Electronics")
                .unitPrice(new BigDecimal("99.99"))
                .lowStockThreshold(10)
                .supplierIds(Arrays.asList(1L))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build()
        );

        stubProductService.setupGetProductsBySupplier(products);

        mockMvc.perform(get("/api/v1/products/supplier/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].supplierIds", hasSize(1)));
    }

    @Test
    void testGetAllCategories_Success() throws Exception {
        List<CategoryDTO> categories = Arrays.asList(
            CategoryDTO.builder()
                .id(1L)
                .name("Electronics")
                .description("Electronic products")
                .createdAt(LocalDateTime.now())
                .build(),
            CategoryDTO.builder()
                .id(2L)
                .name("Clothing")
                .description("Clothing items")
                .createdAt(LocalDateTime.now())
                .build()
        );

        stubProductService.setupGetAllCategories(categories);

        mockMvc.perform(get("/api/v1/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].name").value("Electronics"))
            .andExpect(jsonPath("$[1].id").value(2))
            .andExpect(jsonPath("$[1].name").value("Clothing"));
    }

    @Test
    void testGetCategory_Success() throws Exception {
        CategoryDTO categoryDto = CategoryDTO.builder()
            .id(1L)
            .name("Electronics")
            .description("Electronic products")
            .createdAt(LocalDateTime.now())
            .build();

        stubProductService.setupGetCategory(1L, categoryDto);

        mockMvc.perform(get("/api/v1/categories/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Electronics"))
            .andExpect(jsonPath("$.description").value("Electronic products"));
    }

    @Test
    void testGetCategory_NotFound() throws Exception {
        stubProductService.setupThrowException(new IllegalArgumentException("Category not found: 999"));

        mockMvc.perform(get("/api/v1/categories/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Category not found: 999"));
    }

    /**
     * Test stub for ProductService - works around Java 25 mocking limitations
     */
    static class StubProductService extends ProductService {
        private ProductDTO productResponse;
        private Page<ProductDTO> pageResponse;
        private List<ProductDTO> listResponse;
        private List<CategoryDTO> categoriesResponse;
        private CategoryDTO categoryResponse;
        private RuntimeException exceptionToThrow;

        public StubProductService() {
            super(null, null, null);
        }

        void setupCreateProduct(ProductDTO dto) {
            this.productResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupGetProduct(Long id, ProductDTO dto) {
            this.productResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupListProducts(Page<ProductDTO> page) {
            this.pageResponse = page;
        }

        void setupListProductsByCategory(Page<ProductDTO> page) {
            this.pageResponse = page;
        }

        void setupUpdateProduct(ProductDTO dto) {
            this.productResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupDeleteSuccess() {
            this.exceptionToThrow = null;
        }

        void setupGetProductsBySupplier(List<ProductDTO> products) {
            this.listResponse = products;
        }

        void setupGetAllCategories(List<CategoryDTO> categories) {
            this.categoriesResponse = categories;
        }

        void setupGetCategory(Long id, CategoryDTO dto) {
            this.categoryResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupThrowException(RuntimeException ex) {
            this.exceptionToThrow = ex;
        }

        @Override
        public ProductDTO createProduct(CreateProductRequest request) {
            throwIfNeeded();
            return productResponse;
        }

        @Override
        public ProductDTO getProduct(Long id) {
            throwIfNeeded();
            return productResponse;
        }

        @Override
        public Page<ProductDTO> listProducts(Pageable pageable) {
            throwIfNeeded();
            return pageResponse != null ? pageResponse : new PageImpl<>(new ArrayList<>());
        }

        @Override
        public Page<ProductDTO> listProductsByCategory(Long categoryId, Pageable pageable) {
            throwIfNeeded();
            return pageResponse != null ? pageResponse : new PageImpl<>(new ArrayList<>());
        }

        @Override
        public ProductDTO updateProduct(Long id, UpdateProductRequest request) {
            throwIfNeeded();
            return productResponse;
        }

        @Override
        public void deleteProduct(Long id) {
            throwIfNeeded();
        }

        @Override
        public List<ProductDTO> getProductsBySupplier(Long supplierId) {
            return listResponse != null ? listResponse : new ArrayList<>();
        }

        @Override
        public List<CategoryDTO> getAllCategories() {
            return categoriesResponse != null ? categoriesResponse : new ArrayList<>();
        }

        @Override
        public CategoryDTO getCategory(Long id) {
            throwIfNeeded();
            return categoryResponse;
        }

        private void throwIfNeeded() {
            if (exceptionToThrow != null) {
                throw exceptionToThrow;
            }
        }
    }
}
