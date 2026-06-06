package com.retailr.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailr.order.dto.CreateOrderLineRequest;
import com.retailr.order.dto.CreateOrderRequest;
import com.retailr.order.dto.OrderDTO;
import com.retailr.order.dto.OrderLineDTO;
import com.retailr.order.dto.UpdateOrderStatusRequest;
import com.retailr.order.entity.OrderStatus;
import com.retailr.order.exception.CustomerNotFoundException;
import com.retailr.order.exception.GlobalExceptionHandler;
import com.retailr.order.exception.InsufficientStockException;
import com.retailr.order.exception.OrderNotFoundException;
import com.retailr.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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

class OrderControllerTest {
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private StubOrderService stubOrderService;

    @BeforeEach
    void setUp() {
        stubOrderService = new StubOrderService();
        OrderController controller = new OrderController(stubOrderService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testCreateOrder_Success() throws Exception {
        CreateOrderLineRequest lineRequest = CreateOrderLineRequest.builder()
            .productId(1L)
            .quantity(5)
            .unitPrice(new BigDecimal("99.99"))
            .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
            .customerId(1L)
            .lines(Arrays.asList(lineRequest))
            .build();

        OrderLineDTO lineDto = OrderLineDTO.builder()
            .id(1L)
            .productId(1L)
            .quantity(5)
            .unitPrice(new BigDecimal("99.99"))
            .lineTotal(new BigDecimal("499.95"))
            .build();

        OrderDTO responseDto = OrderDTO.builder()
            .id(1L)
            .orderNumber("ORD-12345678")
            .status(OrderStatus.DRAFT)
            .totalAmount(new BigDecimal("499.95"))
            .createdAt(LocalDateTime.now())
            .lines(Arrays.asList(lineDto))
            .build();

        stubOrderService.setupCreateOrder(responseDto);

        mockMvc.perform(post("/api/v1/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.orderNumber").value("ORD-12345678"))
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void testCreateOrder_CustomerNotFound() throws Exception {
        CreateOrderLineRequest lineRequest = CreateOrderLineRequest.builder()
            .productId(1L)
            .quantity(5)
            .unitPrice(new BigDecimal("99.99"))
            .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
            .customerId(999L)
            .lines(Arrays.asList(lineRequest))
            .build();

        stubOrderService.setupThrowException(
            new CustomerNotFoundException("Customer not found with id: 999")
        );

        mockMvc.perform(post("/api/v1/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("CUSTOMER_NOT_FOUND"));
    }

    @Test
    void testGetOrder_Success() throws Exception {
        OrderLineDTO lineDto = OrderLineDTO.builder()
            .id(1L)
            .productId(1L)
            .quantity(5)
            .unitPrice(new BigDecimal("99.99"))
            .lineTotal(new BigDecimal("499.95"))
            .build();

        OrderDTO responseDto = OrderDTO.builder()
            .id(1L)
            .orderNumber("ORD-12345678")
            .status(OrderStatus.DRAFT)
            .totalAmount(new BigDecimal("499.95"))
            .createdAt(LocalDateTime.now())
            .lines(Arrays.asList(lineDto))
            .build();

        stubOrderService.setupGetOrder(1L, responseDto);

        mockMvc.perform(get("/api/v1/orders/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.orderNumber").value("ORD-12345678"))
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void testGetOrder_NotFound() throws Exception {
        stubOrderService.setupThrowException(
            new OrderNotFoundException("Order not found with id: 999")
        );

        mockMvc.perform(get("/api/v1/orders/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("ORDER_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Order not found with id: 999"));
    }

    @Test
    void testGetOrderByNumber_Success() throws Exception {
        OrderLineDTO lineDto = OrderLineDTO.builder()
            .id(1L)
            .productId(1L)
            .quantity(5)
            .unitPrice(new BigDecimal("99.99"))
            .lineTotal(new BigDecimal("499.95"))
            .build();

        OrderDTO responseDto = OrderDTO.builder()
            .id(1L)
            .orderNumber("ORD-12345678")
            .status(OrderStatus.DRAFT)
            .totalAmount(new BigDecimal("499.95"))
            .createdAt(LocalDateTime.now())
            .lines(Arrays.asList(lineDto))
            .build();

        stubOrderService.setupGetOrderByNumber(responseDto);

        mockMvc.perform(get("/api/v1/orders/number/ORD-12345678"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.orderNumber").value("ORD-12345678"));
    }

    @Test
    void testGetOrderByNumber_NotFound() throws Exception {
        stubOrderService.setupThrowException(
            new OrderNotFoundException("Order not found with orderNumber: ORD-NOTFOUND")
        );

        mockMvc.perform(get("/api/v1/orders/number/ORD-NOTFOUND"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("ORDER_NOT_FOUND"));
    }

    @Test
    void testGetCustomerOrders_Success() throws Exception {
        OrderLineDTO lineDto = OrderLineDTO.builder()
            .id(1L)
            .productId(1L)
            .quantity(5)
            .unitPrice(new BigDecimal("99.99"))
            .lineTotal(new BigDecimal("499.95"))
            .build();

        OrderDTO orderDto1 = OrderDTO.builder()
            .id(1L)
            .orderNumber("ORD-11111111")
            .status(OrderStatus.DRAFT)
            .totalAmount(new BigDecimal("499.95"))
            .createdAt(LocalDateTime.now())
            .lines(Arrays.asList(lineDto))
            .build();

        OrderDTO orderDto2 = OrderDTO.builder()
            .id(2L)
            .orderNumber("ORD-22222222")
            .status(OrderStatus.CONFIRMED)
            .totalAmount(new BigDecimal("799.95"))
            .createdAt(LocalDateTime.now())
            .lines(Arrays.asList(lineDto))
            .build();

        Page<OrderDTO> page = new PageImpl<>(
            Arrays.asList(orderDto1, orderDto2),
            PageRequest.of(0, 20),
            2
        );
        stubOrderService.setupGetCustomerOrders(page);

        mockMvc.perform(get("/api/v1/orders/customers/1")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].id").value(1))
            .andExpect(jsonPath("$.content[0].orderNumber").value("ORD-11111111"))
            .andExpect(jsonPath("$.content[1].id").value(2));
    }

    @Test
    void testGetCustomerOrders_CustomerNotFound() throws Exception {
        stubOrderService.setupThrowException(
            new CustomerNotFoundException("Customer not found with id: 999")
        );

        mockMvc.perform(get("/api/v1/orders/customers/999")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("CUSTOMER_NOT_FOUND"));
    }

    @Test
    void testConfirmOrder_Success() throws Exception {
        OrderLineDTO lineDto = OrderLineDTO.builder()
            .id(1L)
            .productId(1L)
            .quantity(5)
            .unitPrice(new BigDecimal("99.99"))
            .lineTotal(new BigDecimal("499.95"))
            .build();

        OrderDTO responseDto = OrderDTO.builder()
            .id(1L)
            .orderNumber("ORD-12345678")
            .status(OrderStatus.CONFIRMED)
            .totalAmount(new BigDecimal("499.95"))
            .createdAt(LocalDateTime.now())
            .confirmedAt(LocalDateTime.now())
            .lines(Arrays.asList(lineDto))
            .build();

        stubOrderService.setupConfirmOrder(responseDto);

        mockMvc.perform(post("/api/v1/orders/1/confirm"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void testConfirmOrder_InsufficientStock() throws Exception {
        stubOrderService.setupThrowException(
            new InsufficientStockException("Insufficient stock for product 1")
        );

        mockMvc.perform(post("/api/v1/orders/1/confirm"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("INSUFFICIENT_STOCK"));
    }

    @Test
    void testUpdateOrderStatus_Success() throws Exception {
        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
            .status(OrderStatus.FULFILLED)
            .build();

        OrderLineDTO lineDto = OrderLineDTO.builder()
            .id(1L)
            .productId(1L)
            .quantity(5)
            .unitPrice(new BigDecimal("99.99"))
            .lineTotal(new BigDecimal("499.95"))
            .build();

        OrderDTO responseDto = OrderDTO.builder()
            .id(1L)
            .orderNumber("ORD-12345678")
            .status(OrderStatus.FULFILLED)
            .totalAmount(new BigDecimal("499.95"))
            .createdAt(LocalDateTime.now())
            .fulfilledAt(LocalDateTime.now())
            .lines(Arrays.asList(lineDto))
            .build();

        stubOrderService.setupUpdateOrderStatus(responseDto);

        mockMvc.perform(put("/api/v1/orders/1/status")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.status").value("FULFILLED"));
    }

    @Test
    void testUpdateOrderStatus_ValidationError() throws Exception {
        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();  // status is null
        request.setStatus(null);

        mockMvc.perform(put("/api/v1/orders/1/status")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void testCancelOrder_Success() throws Exception {
        OrderLineDTO lineDto = OrderLineDTO.builder()
            .id(1L)
            .productId(1L)
            .quantity(5)
            .unitPrice(new BigDecimal("99.99"))
            .lineTotal(new BigDecimal("499.95"))
            .build();

        OrderDTO responseDto = OrderDTO.builder()
            .id(1L)
            .orderNumber("ORD-12345678")
            .status(OrderStatus.CANCELLED)
            .totalAmount(new BigDecimal("499.95"))
            .createdAt(LocalDateTime.now())
            .cancelledAt(LocalDateTime.now())
            .lines(Arrays.asList(lineDto))
            .build();

        stubOrderService.setupCancelOrder(responseDto);

        mockMvc.perform(post("/api/v1/orders/1/cancel"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void testCancelOrder_NotFound() throws Exception {
        stubOrderService.setupThrowException(
            new OrderNotFoundException("Order not found with id: 999")
        );

        mockMvc.perform(post("/api/v1/orders/999/cancel"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("ORDER_NOT_FOUND"));
    }

    @Test
    void testDeleteOrder_Success() throws Exception {
        stubOrderService.setupDeleteSuccess();

        mockMvc.perform(delete("/api/v1/orders/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    void testDeleteOrder_NotFound() throws Exception {
        stubOrderService.setupThrowException(
            new OrderNotFoundException("Order not found with id: 999")
        );

        mockMvc.perform(delete("/api/v1/orders/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("ORDER_NOT_FOUND"));
    }

    static class StubOrderService extends OrderService {
        private OrderDTO orderResponse;
        private Page<OrderDTO> pageResponse;
        private RuntimeException exceptionToThrow;

        StubOrderService() {
            super(null, null, null, null, null, null, null);
        }

        void setupCreateOrder(OrderDTO dto) {
            this.orderResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupGetOrder(Long id, OrderDTO dto) {
            this.orderResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupGetOrderByNumber(OrderDTO dto) {
            this.orderResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupGetCustomerOrders(Page<OrderDTO> page) {
            this.pageResponse = page;
            this.exceptionToThrow = null;
        }

        void setupConfirmOrder(OrderDTO dto) {
            this.orderResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupUpdateOrderStatus(OrderDTO dto) {
            this.orderResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupCancelOrder(OrderDTO dto) {
            this.orderResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupDeleteSuccess() {
            this.exceptionToThrow = null;
        }

        void setupThrowException(RuntimeException ex) {
            this.exceptionToThrow = ex;
        }

        @Override
        public OrderDTO createOrder(CreateOrderRequest request) {
            throwIfNeeded();
            return orderResponse;
        }

        @Override
        public OrderDTO getOrder(Long orderId) {
            throwIfNeeded();
            return orderResponse;
        }

        @Override
        public OrderDTO getOrderByNumber(String orderNumber) {
            throwIfNeeded();
            return orderResponse;
        }

        @Override
        public Page<OrderDTO> getCustomerOrders(Long customerId, org.springframework.data.domain.Pageable pageable) {
            throwIfNeeded();
            return pageResponse != null ? pageResponse : new PageImpl<>(new ArrayList<>());
        }

        @Override
        public OrderDTO confirmOrder(Long orderId) {
            throwIfNeeded();
            return orderResponse;
        }

        @Override
        public OrderDTO updateOrderStatus(Long orderId, com.retailr.order.entity.OrderStatus newStatus) {
            throwIfNeeded();
            return orderResponse;
        }

        @Override
        public OrderDTO cancelOrder(Long orderId) {
            throwIfNeeded();
            return orderResponse;
        }

        @Override
        public void deleteOrder(Long orderId) {
            throwIfNeeded();
        }

        private void throwIfNeeded() {
            if (exceptionToThrow != null) {
                throw exceptionToThrow;
            }
        }
    }
}
