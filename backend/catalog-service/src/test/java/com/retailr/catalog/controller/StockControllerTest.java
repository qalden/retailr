package com.retailr.catalog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailr.catalog.dto.CreateStockMovementRequest;
import com.retailr.catalog.dto.LowStockAlertDTO;
import com.retailr.catalog.dto.StockItemDTO;
import com.retailr.catalog.dto.StockMovementDTO;
import com.retailr.catalog.exception.GlobalExceptionHandler;
import com.retailr.catalog.exception.StockException;
import com.retailr.catalog.service.StockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class StockControllerTest {
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private StubStockService stubStockService;

    @BeforeEach
    void setUp() {
        stubStockService = new StubStockService();
        StockController controller = new StockController(stubStockService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testGetStockItem_Success() throws Exception {
        StockItemDTO dto = StockItemDTO.builder()
            .id(1L)
            .productId(10L)
            .warehouseId(20L)
            .quantity(100)
            .reservedQuantity(20)
            .availableQuantity(80)
            .updatedAt(LocalDateTime.now())
            .build();

        stubStockService.setupGetStockItem(1L, dto);

        mockMvc.perform(get("/api/v1/stock/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.productId").value(10))
            .andExpect(jsonPath("$.warehouseId").value(20))
            .andExpect(jsonPath("$.quantity").value(100))
            .andExpect(jsonPath("$.reservedQuantity").value(20))
            .andExpect(jsonPath("$.availableQuantity").value(80));
    }

    @Test
    void testGetStockItem_NotFound() throws Exception {
        stubStockService.setupThrowException(new IllegalArgumentException("StockItem not found: 999"));

        mockMvc.perform(get("/api/v1/stock/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("StockItem not found: 999"));
    }

    @Test
    void testGetStockByProduct_Success() throws Exception {
        List<StockItemDTO> items = new ArrayList<>();
        items.add(StockItemDTO.builder()
            .id(1L)
            .productId(10L)
            .warehouseId(20L)
            .quantity(100)
            .reservedQuantity(20)
            .availableQuantity(80)
            .updatedAt(LocalDateTime.now())
            .build());
        items.add(StockItemDTO.builder()
            .id(2L)
            .productId(10L)
            .warehouseId(21L)
            .quantity(50)
            .reservedQuantity(10)
            .availableQuantity(40)
            .updatedAt(LocalDateTime.now())
            .build());

        stubStockService.setupGetStockByProduct(10L, items);

        mockMvc.perform(get("/api/v1/stock/product/10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    void testGetStockByProduct_Empty() throws Exception {
        stubStockService.setupGetStockByProduct(999L, new ArrayList<>());

        mockMvc.perform(get("/api/v1/stock/product/999"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void testRecordMovement_Success() throws Exception {
        CreateStockMovementRequest request = CreateStockMovementRequest.builder()
            .stockItemId(1L)
            .quantityDelta(10)
            .movementType("INBOUND")
            .referenceType("PURCHASE_ORDER")
            .referenceId(100L)
            .build();

        StockMovementDTO responseDto = StockMovementDTO.builder()
            .id(1L)
            .stockItemId(1L)
            .quantityDelta(10)
            .movementType("INBOUND")
            .referenceType("PURCHASE_ORDER")
            .referenceId(100L)
            .createdAt(LocalDateTime.now())
            .build();

        stubStockService.setupRecordMovement(responseDto);

        mockMvc.perform(post("/api/v1/stock/movement")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.quantityDelta").value(10))
            .andExpect(jsonPath("$.movementType").value("INBOUND"));
    }

    @Test
    void testRecordMovement_InvalidRequest() throws Exception {
        CreateStockMovementRequest request = CreateStockMovementRequest.builder()
            .stockItemId(null)
            .quantityDelta(10)
            .movementType("INBOUND")
            .referenceType("PURCHASE_ORDER")
            .referenceId(100L)
            .build();

        mockMvc.perform(post("/api/v1/stock/movement")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.message").value("Validation failed"));
    }

    @Test
    void testReserveStock_Success() throws Exception {
        stubStockService.setupReserveSuccess();

        mockMvc.perform(post("/api/v1/stock/1/reserve")
            .param("quantity", "20"))
            .andExpect(status().isOk());
    }

    @Test
    void testReserveStock_StockItemNotFound() throws Exception {
        stubStockService.setupThrowException(
            new IllegalArgumentException("StockItem not found: 999"));

        mockMvc.perform(post("/api/v1/stock/999/reserve")
            .param("quantity", "20"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("StockItem not found: 999"));
    }

    @Test
    void testReserveStock_InsufficientStock() throws Exception {
        stubStockService.setupThrowException(
            new StockException("Insufficient stock available. Available: 10, Requested: 20"));

        mockMvc.perform(post("/api/v1/stock/1/reserve")
            .param("quantity", "20"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("STOCK_ERROR"))
            .andExpect(jsonPath("$.message").value("Insufficient stock available. Available: 10, Requested: 20"));
    }

    @Test
    void testGetStockByWarehouse_Success() throws Exception {
        List<StockItemDTO> items = new ArrayList<>();
        items.add(StockItemDTO.builder()
            .id(1L)
            .productId(10L)
            .warehouseId(20L)
            .quantity(100)
            .reservedQuantity(20)
            .availableQuantity(80)
            .updatedAt(LocalDateTime.now())
            .build());

        stubStockService.setupGetStockByWarehouse(20L, items);

        mockMvc.perform(get("/api/v1/stock/warehouse/20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].warehouseId").value(20));
    }

    @Test
    void testGetStockItemByProductAndWarehouse_Success() throws Exception {
        StockItemDTO dto = StockItemDTO.builder()
            .id(1L)
            .productId(10L)
            .warehouseId(20L)
            .quantity(100)
            .reservedQuantity(20)
            .availableQuantity(80)
            .updatedAt(LocalDateTime.now())
            .build();

        stubStockService.setupGetStockItemByProductAndWarehouse(10L, 20L, dto);

        mockMvc.perform(get("/api/v1/stock/product/10/warehouse/20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.productId").value(10))
            .andExpect(jsonPath("$.warehouseId").value(20));
    }

    @Test
    void testGetMovementsForStockItem_Success() throws Exception {
        List<StockMovementDTO> movements = new ArrayList<>();
        movements.add(StockMovementDTO.builder()
            .id(1L)
            .stockItemId(1L)
            .quantityDelta(10)
            .movementType("INBOUND")
            .referenceType("PURCHASE_ORDER")
            .referenceId(100L)
            .createdAt(LocalDateTime.now())
            .build());

        stubStockService.setupGetMovementsForStockItem(1L, movements);

        mockMvc.perform(get("/api/v1/stock/1/movements"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].movementType").value("INBOUND"));
    }

    @Test
    void testReleaseStock_Success() throws Exception {
        stubStockService.setupReleaseSuccess();

        mockMvc.perform(post("/api/v1/stock/1/release")
            .param("quantity", "10"))
            .andExpect(status().isOk());
    }

    @Test
    void testReleaseStock_StockItemNotFound() throws Exception {
        stubStockService.setupThrowException(
            new IllegalArgumentException("StockItem not found: 999"));

        mockMvc.perform(post("/api/v1/stock/999/release")
            .param("quantity", "10"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("StockItem not found: 999"));
    }

    @Test
    void testReleaseStock_ExceedsReserved() throws Exception {
        stubStockService.setupThrowException(
            new StockException("Cannot release more than reserved. Reserved: 5, Requested: 10"));

        mockMvc.perform(post("/api/v1/stock/1/release")
            .param("quantity", "10"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("STOCK_ERROR"))
            .andExpect(jsonPath("$.message").value("Cannot release more than reserved. Reserved: 5, Requested: 10"));
    }

    @Test
    void testGetUnacknowledgedAlerts_Success() throws Exception {
        List<LowStockAlertDTO> alerts = new ArrayList<>();
        alerts.add(LowStockAlertDTO.builder()
            .id(1L)
            .stockItemId(1L)
            .triggeredAt(LocalDateTime.now())
            .build());

        stubStockService.setupGetUnacknowledgedAlerts(alerts);

        mockMvc.perform(get("/api/v1/stock/alerts"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void testGetAlertsForStockItem_Success() throws Exception {
        List<LowStockAlertDTO> alerts = new ArrayList<>();
        alerts.add(LowStockAlertDTO.builder()
            .id(1L)
            .stockItemId(1L)
            .triggeredAt(LocalDateTime.now())
            .build());

        stubStockService.setupGetAlertsForStockItem(1L, alerts);

        mockMvc.perform(get("/api/v1/stock/1/alerts"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].stockItemId").value(1L));
    }

    /**
     * Test stub for StockService - works around Java 25 mocking limitations
     */
    static class StubStockService extends StockService {
        private StockItemDTO stockItemResponse;
        private List<StockItemDTO> stockItemsResponse;
        private StockMovementDTO movementResponse;
        private List<StockMovementDTO> movementsResponse;
        private List<LowStockAlertDTO> alertsResponse;
        private RuntimeException exceptionToThrow;

        public StubStockService() {
            super(null, null, null, null);
        }

        void setupGetStockItem(Long id, StockItemDTO dto) {
            this.stockItemResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupGetStockByProduct(Long productId, List<StockItemDTO> items) {
            this.stockItemsResponse = items;
        }

        void setupGetStockByWarehouse(Long warehouseId, List<StockItemDTO> items) {
            this.stockItemsResponse = items;
        }

        void setupGetStockItemByProductAndWarehouse(Long productId, Long warehouseId, StockItemDTO dto) {
            this.stockItemResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupRecordMovement(StockMovementDTO dto) {
            this.movementResponse = dto;
        }

        void setupGetMovementsForStockItem(Long stockItemId, List<StockMovementDTO> movements) {
            this.movementsResponse = movements;
        }

        void setupGetUnacknowledgedAlerts(List<LowStockAlertDTO> alerts) {
            this.alertsResponse = alerts;
        }

        void setupGetAlertsForStockItem(Long stockItemId, List<LowStockAlertDTO> alerts) {
            this.alertsResponse = alerts;
        }

        void setupReserveSuccess() {
            this.exceptionToThrow = null;
        }

        void setupReleaseSuccess() {
            this.exceptionToThrow = null;
        }

        void setupThrowException(RuntimeException ex) {
            this.exceptionToThrow = ex;
        }

        @Override
        public StockItemDTO getStockItem(Long id) {
            throwIfNeeded();
            return stockItemResponse;
        }

        @Override
        public List<StockItemDTO> getStockByProduct(Long productId) {
            return stockItemsResponse != null ? stockItemsResponse : new ArrayList<>();
        }

        @Override
        public List<StockItemDTO> getStockByWarehouse(Long warehouseId) {
            return stockItemsResponse != null ? stockItemsResponse : new ArrayList<>();
        }

        @Override
        public StockItemDTO getStockItemByProductAndWarehouse(Long productId, Long warehouseId) {
            throwIfNeeded();
            return stockItemResponse;
        }

        @Override
        public StockMovementDTO recordMovement(CreateStockMovementRequest request) {
            return movementResponse;
        }

        @Override
        public List<StockMovementDTO> getMovementsForStockItem(Long stockItemId) {
            return movementsResponse != null ? movementsResponse : new ArrayList<>();
        }

        @Override
        public List<LowStockAlertDTO> getUnacknowledgedAlerts() {
            return alertsResponse != null ? alertsResponse : new ArrayList<>();
        }

        @Override
        public List<LowStockAlertDTO> getAlertsForStockItem(Long stockItemId) {
            return alertsResponse != null ? alertsResponse : new ArrayList<>();
        }

        @Override
        public void reserveStock(Long stockItemId, Integer quantity) {
            throwIfNeeded();
        }

        @Override
        public void releaseStock(Long stockItemId, Integer quantity) {
            throwIfNeeded();
        }

        private void throwIfNeeded() {
            if (exceptionToThrow != null) {
                throw exceptionToThrow;
            }
        }
    }
}
