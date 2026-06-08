package com.retailr.catalog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailr.catalog.dto.ProductDTO;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test suite for ProductFilterController.
 * Tests server-side filtering, searching, sorting, and pagination of products.
 */
class ProductFilterControllerTest {
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private StubProductService stubProductService;

    @BeforeEach
    void setUp() {
        stubProductService = new StubProductService();
        ProductFilterController controller = new ProductFilterController(
            stubProductService,
            new ObjectMapper()
        );
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    @Test
    void testSearchProducts_NoParameters_ReturnAllProducts() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Laptop", "Electronics", new BigDecimal("999.99")),
            createProductDTO(2L, "SKU002", "Mouse", "Electronics", new BigDecimal("29.99"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 2);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products/search")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].name").value("Laptop"))
            .andExpect(jsonPath("$.content[1].name").value("Mouse"));
    }

    @Test
    void testSearchProducts_WithSearchTerm_FiltersResults() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Laptop", "Electronics", new BigDecimal("999.99")),
            createProductDTO(2L, "SKU002", "Desktop", "Electronics", new BigDecimal("1299.99"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 2);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products/search")
            .param("search", "Laptop")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].name").value("Laptop"));
    }

    @Test
    void testSearchProducts_WithSearchInSKU_FindsProduct() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU123", "Test Product", "Electronics", new BigDecimal("99.99"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 1);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products/search")
            .param("search", "SKU123"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].sku").value("SKU123"));
    }

    @Test
    void testSearchProducts_WithPriceFilter_FiltersByPrice() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Expensive Item", "Electronics", new BigDecimal("1000.00")),
            createProductDTO(2L, "SKU002", "Budget Item", "Electronics", new BigDecimal("50.00"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 2);
        stubProductService.setupListProducts(page);

        String filterJson = "[{\"field\":\"unitPrice\",\"operator\":\"gt\",\"value\":\"100\"}]";

        mockMvc.perform(get("/api/v1/products/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].name").value("Expensive Item"));
    }

    @Test
    void testSearchProducts_WithCategoryFilter_FiltersByCategory() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Laptop", "Electronics", new BigDecimal("999.99")),
            createProductDTO(2L, "SKU002", "Shirt", "Clothing", new BigDecimal("29.99"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 2);
        stubProductService.setupListProducts(page);

        String filterJson = "[{\"field\":\"category\",\"operator\":\"eq\",\"value\":\"Electronics\"}]";

        mockMvc.perform(get("/api/v1/products/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].categoryName").value("Electronics"));
    }

    @Test
    void testSearchProducts_WithNameContainsFilter() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Wireless Mouse", "Electronics", new BigDecimal("29.99")),
            createProductDTO(2L, "SKU002", "Wireless Keyboard", "Electronics", new BigDecimal("79.99"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 2);
        stubProductService.setupListProducts(page);

        String filterJson = "[{\"field\":\"name\",\"operator\":\"contains\",\"value\":\"Wireless\"}]";

        mockMvc.perform(get("/api/v1/products/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)));
    }

    @Test
    void testSearchProducts_WithMultipleFilters() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Expensive Laptop", "Electronics", new BigDecimal("999.99"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 1);
        stubProductService.setupListProducts(page);

        String filterJson = "[" +
            "{\"field\":\"unitPrice\",\"operator\":\"gt\",\"value\":\"500\"}," +
            "{\"field\":\"category\",\"operator\":\"eq\",\"value\":\"Electronics\"}" +
            "]";

        mockMvc.perform(get("/api/v1/products/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void testSearchProducts_WithSortAscending() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(2L, "SKU002", "Budget Item", "Electronics", new BigDecimal("50.00")),
            createProductDTO(1L, "SKU001", "Expensive Item", "Electronics", new BigDecimal("1000.00"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 2);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products/search")
            .param("sort", "unitPrice:asc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].unitPrice").value(50.00));
    }

    @Test
    void testSearchProducts_WithSortDescending() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Expensive Item", "Electronics", new BigDecimal("1000.00")),
            createProductDTO(2L, "SKU002", "Budget Item", "Electronics", new BigDecimal("50.00"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 2);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products/search")
            .param("sort", "unitPrice:desc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].unitPrice").value(1000.00));
    }

    @Test
    void testSearchProducts_WithSortByName() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(2L, "SKU002", "Apple", "Fruits", new BigDecimal("1.00")),
            createProductDTO(1L, "SKU001", "Zebra", "Animals", new BigDecimal("100.00"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 2);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products/search")
            .param("sort", "name:asc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].name").value("Apple"))
            .andExpect(jsonPath("$.content[1].name").value("Zebra"));
    }

    @Test
    void testSearchProducts_WithPagination() throws Exception {
        List<ProductDTO> page1Products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Product 1", "Electronics", new BigDecimal("99.99")),
            createProductDTO(2L, "SKU002", "Product 2", "Electronics", new BigDecimal("199.99"))
        );

        // Return only 2 products (the service doesn't know about total count in test)
        Page<ProductDTO> page = new PageImpl<>(page1Products, PageRequest.of(0, 2), 2);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products/search")
            .param("page", "0")
            .param("size", "2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.size").value(2));
    }

    @Test
    void testSearchProducts_ValidPaginationParameters() throws Exception {
        List<ProductDTO> products = new ArrayList<>();
        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(1, 10), 0);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products/search")
            .param("page", "1")
            .param("size", "10"))
            .andExpect(status().isOk());
    }

    @Test
    void testSearchProducts_MaxSizeValidation() throws Exception {
        List<ProductDTO> products = new ArrayList<>();
        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 100), 0);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products/search")
            .param("page", "0")
            .param("size", "100"))
            .andExpect(status().isOk());
    }

    @Test
    void testSearchProducts_WithRangeFilter() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Mid Range", "Electronics", new BigDecimal("500.00"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 1);
        stubProductService.setupListProducts(page);

        String filterJson = "[{\"field\":\"unitPrice\",\"operator\":\"between\",\"value\":\"100,1000\"}]";

        mockMvc.perform(get("/api/v1/products/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void testSearchProducts_WithInFilter() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Laptop", "Electronics", new BigDecimal("999.99")),
            createProductDTO(2L, "SKU002", "Mouse", "Electronics", new BigDecimal("29.99")),
            createProductDTO(3L, "SKU003", "Shirt", "Clothing", new BigDecimal("29.99"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 3);
        stubProductService.setupListProducts(page);

        String filterJson = "[{\"field\":\"category\",\"operator\":\"in\",\"value\":\"Electronics,Clothing\"}]";

        mockMvc.perform(get("/api/v1/products/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(3)));
    }

    @Test
    void testSearchProducts_CombinedSearchAndFilters() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Wireless Laptop", "Electronics", new BigDecimal("999.99"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 1);
        stubProductService.setupListProducts(page);

        String filterJson = "[{\"field\":\"unitPrice\",\"operator\":\"gt\",\"value\":\"500\"}]";

        mockMvc.perform(get("/api/v1/products/search")
            .param("search", "Wireless")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].name").value("Wireless Laptop"));
    }

    @Test
    void testSearchProducts_SearchTermCaseInsensitive() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Laptop", "Electronics", new BigDecimal("999.99"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 1);
        stubProductService.setupListProducts(page);

        mockMvc.perform(get("/api/v1/products/search")
            .param("search", "LAPTOP"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void testSearchProducts_FilterCaseInsensitive() throws Exception {
        List<ProductDTO> products = Arrays.asList(
            createProductDTO(1L, "SKU001", "Laptop", "Electronics", new BigDecimal("999.99"))
        );

        Page<ProductDTO> page = new PageImpl<>(products, PageRequest.of(0, 20), 1);
        stubProductService.setupListProducts(page);

        String filterJson = "[{\"field\":\"category\",\"operator\":\"eq\",\"value\":\"electronics\"}]";

        mockMvc.perform(get("/api/v1/products/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)));
    }

    private ProductDTO createProductDTO(Long id, String sku, String name, String category, BigDecimal price) {
        return ProductDTO.builder()
            .id(id)
            .sku(sku)
            .name(name)
            .description("Description for " + name)
            .categoryId(1L)
            .categoryName(category)
            .unitPrice(price)
            .lowStockThreshold(10)
            .supplierIds(new ArrayList<>())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }

    /**
     * Test stub for ProductService - works around Java limitations
     */
    static class StubProductService extends ProductService {
        private Page<ProductDTO> pageResponse;

        public StubProductService() {
            super(null, null, null);
        }

        void setupListProducts(Page<ProductDTO> page) {
            this.pageResponse = page;
        }

        @Override
        public Page<ProductDTO> listProducts(Pageable pageable) {
            return pageResponse != null ? pageResponse : new PageImpl<>(new ArrayList<>());
        }

        @Override
        public Page<ProductDTO> listActiveProducts(Pageable pageable) {
            return pageResponse != null ? pageResponse : new PageImpl<>(new ArrayList<>());
        }

        @Override
        public Page<ProductDTO> listProductsByCategory(Long categoryId, Pageable pageable) {
            return pageResponse != null ? pageResponse : new PageImpl<>(new ArrayList<>());
        }
    }
}
