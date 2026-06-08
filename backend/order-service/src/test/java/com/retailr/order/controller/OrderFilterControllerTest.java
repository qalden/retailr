package com.retailr.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailr.order.dto.CustomerDTO;
import com.retailr.order.dto.OrderDTO;
import com.retailr.order.dto.OrderLineDTO;
import com.retailr.order.entity.OrderStatus;
import com.retailr.order.exception.GlobalExceptionHandler;
import com.retailr.order.service.OrderService;
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
 * Test suite for OrderFilterController.
 * Tests server-side filtering, searching, sorting, and pagination of orders.
 */
class OrderFilterControllerTest {
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private StubOrderService stubOrderService;

    @BeforeEach
    void setUp() {
        stubOrderService = new StubOrderService();
        OrderFilterController controller = new OrderFilterController(
            stubOrderService,
            new ObjectMapper()
        );
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    @Test
    void testSearchOrders_NoParameters_ReturnAllOrders() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.DRAFT, new BigDecimal("499.95")),
            createOrderDTO(2L, "ORD-87654321", OrderStatus.CONFIRMED, new BigDecimal("299.99"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 2);
        stubOrderService.setupListAllOrders(page);

        mockMvc.perform(get("/api/v1/orders/search")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].orderNumber").value("ORD-12345678"))
            .andExpect(jsonPath("$.content[1].orderNumber").value("ORD-87654321"));
    }

    @Test
    void testSearchOrders_WithSearchTerm_FiltersResults() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.DRAFT, new BigDecimal("499.95"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 1);
        stubOrderService.setupListAllOrders(page);

        mockMvc.perform(get("/api/v1/orders/search")
            .param("search", "ORD-12345678")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].orderNumber").value("ORD-12345678"));
    }

    @Test
    void testSearchOrders_WithSearchByCustomerName_FiltersResults() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTOWithCustomer(1L, "ORD-12345678", OrderStatus.DRAFT,
                new BigDecimal("499.95"), "John Doe")
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 1);
        stubOrderService.setupListAllOrders(page);

        mockMvc.perform(get("/api/v1/orders/search")
            .param("search", "John"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].customer.name").value("John Doe"));
    }

    @Test
    void testSearchOrders_WithStatusFilter_FiltersByStatus() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.CONFIRMED, new BigDecimal("499.95")),
            createOrderDTO(2L, "ORD-87654321", OrderStatus.DRAFT, new BigDecimal("299.99"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 2);
        stubOrderService.setupListAllOrders(page);

        String filterJson = "[{\"field\":\"status\",\"operator\":\"eq\",\"value\":\"CONFIRMED\"}]";

        mockMvc.perform(get("/api/v1/orders/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].status").value("CONFIRMED"));
    }

    @Test
    void testSearchOrders_WithAmountFilter_FiltersByAmount() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.DRAFT, new BigDecimal("999.99")),
            createOrderDTO(2L, "ORD-87654321", OrderStatus.DRAFT, new BigDecimal("99.99"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 2);
        stubOrderService.setupListAllOrders(page);

        String filterJson = "[{\"field\":\"totalAmount\",\"operator\":\"gt\",\"value\":\"500\"}]";

        mockMvc.perform(get("/api/v1/orders/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].totalAmount").value(999.99));
    }

    @Test
    void testSearchOrders_WithMultipleStatusFilter() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.CONFIRMED, new BigDecimal("499.95")),
            createOrderDTO(2L, "ORD-87654321", OrderStatus.FULFILLED, new BigDecimal("299.99")),
            createOrderDTO(3L, "ORD-11111111", OrderStatus.DRAFT, new BigDecimal("199.99"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 3);
        stubOrderService.setupListAllOrders(page);

        String filterJson = "[{\"field\":\"status\",\"operator\":\"in\",\"value\":\"CONFIRMED,FULFILLED\"}]";

        mockMvc.perform(get("/api/v1/orders/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)));
    }

    @Test
    void testSearchOrders_WithAmountRange() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.DRAFT, new BigDecimal("500.00"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 1);
        stubOrderService.setupListAllOrders(page);

        String filterJson = "[{\"field\":\"totalAmount\",\"operator\":\"between\",\"value\":\"100,1000\"}]";

        mockMvc.perform(get("/api/v1/orders/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void testSearchOrders_WithSortByCreatedDate_Descending() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTOWithDate(1L, "ORD-12345678", OrderStatus.DRAFT, new BigDecimal("499.95"), now),
            createOrderDTOWithDate(2L, "ORD-87654321", OrderStatus.DRAFT, new BigDecimal("299.99"), now.minusDays(1))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 2);
        stubOrderService.setupListAllOrders(page);

        mockMvc.perform(get("/api/v1/orders/search")
            .param("sort", "createdAt:desc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].orderNumber").value("ORD-12345678"));
    }

    @Test
    void testSearchOrders_WithSortByAmount_Ascending() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-87654321", OrderStatus.DRAFT, new BigDecimal("99.99")),
            createOrderDTO(2L, "ORD-12345678", OrderStatus.DRAFT, new BigDecimal("999.99"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 2);
        stubOrderService.setupListAllOrders(page);

        mockMvc.perform(get("/api/v1/orders/search")
            .param("sort", "amount:asc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].totalAmount").value(99.99))
            .andExpect(jsonPath("$.content[1].totalAmount").value(999.99));
    }

    @Test
    void testSearchOrders_WithSortByStatus() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.CONFIRMED, new BigDecimal("499.95")),
            createOrderDTO(2L, "ORD-87654321", OrderStatus.DRAFT, new BigDecimal("299.99"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 2);
        stubOrderService.setupListAllOrders(page);

        mockMvc.perform(get("/api/v1/orders/search")
            .param("sort", "status:asc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)));
    }

    @Test
    void testSearchOrders_WithPagination() throws Exception {
        List<OrderDTO> page1Orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.DRAFT, new BigDecimal("499.95")),
            createOrderDTO(2L, "ORD-87654321", OrderStatus.DRAFT, new BigDecimal("299.99"))
        );

        Page<OrderDTO> page = new PageImpl<>(page1Orders, PageRequest.of(0, 2), 2);
        stubOrderService.setupListAllOrders(page);

        mockMvc.perform(get("/api/v1/orders/search")
            .param("page", "0")
            .param("size", "2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.size").value(2));
    }

    @Test
    void testSearchOrders_ValidPaginationParameters() throws Exception {
        List<OrderDTO> orders = new ArrayList<>();
        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(1, 10), 0);
        stubOrderService.setupListAllOrders(page);

        mockMvc.perform(get("/api/v1/orders/search")
            .param("page", "1")
            .param("size", "10"))
            .andExpect(status().isOk());
    }

    @Test
    void testSearchOrders_MaxSizeValidation() throws Exception {
        List<OrderDTO> orders = new ArrayList<>();
        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 100), 0);
        stubOrderService.setupListAllOrders(page);

        mockMvc.perform(get("/api/v1/orders/search")
            .param("page", "0")
            .param("size", "100"))
            .andExpect(status().isOk());
    }

    @Test
    void testSearchOrders_CombinedSearchAndFilters() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.CONFIRMED, new BigDecimal("999.99"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 1);
        stubOrderService.setupListAllOrders(page);

        String filterJson = "[{\"field\":\"totalAmount\",\"operator\":\"gt\",\"value\":\"500\"}]";

        mockMvc.perform(get("/api/v1/orders/search")
            .param("search", "ORD-12345678")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].orderNumber").value("ORD-12345678"));
    }

    @Test
    void testSearchOrders_SearchAndFilterAndSort() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.CONFIRMED, new BigDecimal("999.99"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 1);
        stubOrderService.setupListAllOrders(page);

        String filterJson = "[{\"field\":\"status\",\"operator\":\"eq\",\"value\":\"CONFIRMED\"}]";

        mockMvc.perform(get("/api/v1/orders/search")
            .param("search", "ORD-123")
            .param("filters", filterJson)
            .param("sort", "createdAt:desc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void testSearchOrders_CaseInsensitiveSearch() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.DRAFT, new BigDecimal("499.95"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 1);
        stubOrderService.setupListAllOrders(page);

        mockMvc.perform(get("/api/v1/orders/search")
            .param("search", "ord-12345678"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void testSearchOrders_CaseInsensitiveStatusFilter() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-12345678", OrderStatus.CONFIRMED, new BigDecimal("499.95"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 1);
        stubOrderService.setupListAllOrders(page);

        String filterJson = "[{\"field\":\"status\",\"operator\":\"eq\",\"value\":\"confirmed\"}]";

        mockMvc.perform(get("/api/v1/orders/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void testSearchOrders_LessThanFilter() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-87654321", OrderStatus.DRAFT, new BigDecimal("99.99"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 1);
        stubOrderService.setupListAllOrders(page);

        String filterJson = "[{\"field\":\"totalAmount\",\"operator\":\"lt\",\"value\":\"500\"}]";

        mockMvc.perform(get("/api/v1/orders/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].totalAmount").value(99.99));
    }

    @Test
    void testSearchOrders_NotEqualsFilter() throws Exception {
        List<OrderDTO> orders = Arrays.asList(
            createOrderDTO(1L, "ORD-87654321", OrderStatus.DRAFT, new BigDecimal("99.99")),
            createOrderDTO(2L, "ORD-12345678", OrderStatus.FULFILLED, new BigDecimal("499.95"))
        );

        Page<OrderDTO> page = new PageImpl<>(orders, PageRequest.of(0, 20), 2);
        stubOrderService.setupListAllOrders(page);

        String filterJson = "[{\"field\":\"status\",\"operator\":\"ne\",\"value\":\"CONFIRMED\"}]";

        mockMvc.perform(get("/api/v1/orders/search")
            .param("filters", filterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)));
    }

    private OrderDTO createOrderDTO(Long id, String orderNumber, OrderStatus status, BigDecimal amount) {
        return createOrderDTOWithCustomer(id, orderNumber, status, amount, "Customer " + id);
    }

    private OrderDTO createOrderDTOWithCustomer(Long id, String orderNumber, OrderStatus status,
                                               BigDecimal amount, String customerName) {
        return OrderDTO.builder()
            .id(id)
            .orderNumber(orderNumber)
            .customer(CustomerDTO.builder()
                .id(1L)
                .name(customerName)
                .email("customer@example.com")
                .build())
            .status(status)
            .totalAmount(amount)
            .lines(new ArrayList<>())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }

    private OrderDTO createOrderDTOWithDate(Long id, String orderNumber, OrderStatus status,
                                           BigDecimal amount, LocalDateTime createdAt) {
        return OrderDTO.builder()
            .id(id)
            .orderNumber(orderNumber)
            .customer(CustomerDTO.builder()
                .id(1L)
                .name("Customer " + id)
                .email("customer@example.com")
                .build())
            .status(status)
            .totalAmount(amount)
            .lines(new ArrayList<>())
            .createdAt(createdAt)
            .updatedAt(createdAt)
            .build();
    }

    /**
     * Test stub for OrderService - works around Java limitations
     */
    static class StubOrderService extends OrderService {
        private Page<OrderDTO> pageResponse;

        public StubOrderService() {
            super(null, null, null, null, null, null, null);
        }

        void setupListAllOrders(Page<OrderDTO> page) {
            this.pageResponse = page;
        }

        @Override
        public Page<OrderDTO> listAllOrders(Pageable pageable) {
            return pageResponse != null ? pageResponse : new PageImpl<>(new ArrayList<>());
        }
    }
}
