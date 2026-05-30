package com.retailr.catalog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailr.catalog.dto.CreateSupplierRequest;
import com.retailr.catalog.dto.SupplierDTO;
import com.retailr.catalog.dto.UpdateSupplierRequest;
import com.retailr.catalog.exception.GlobalExceptionHandler;
import com.retailr.catalog.service.SupplierService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SupplierControllerTest {
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private StubSupplierService stubSupplierService;

    @BeforeEach
    void setUp() {
        stubSupplierService = new StubSupplierService();
        SupplierController controller = new SupplierController(stubSupplierService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testCreateSupplier_Success() throws Exception {
        CreateSupplierRequest request = CreateSupplierRequest.builder()
            .name("Acme Supplies")
            .contactPerson("John Doe")
            .email("john@acme.com")
            .phone("555-1234")
            .address("123 Main St")
            .build();

        SupplierDTO responseDto = SupplierDTO.builder()
            .id(1L)
            .name("Acme Supplies")
            .contactPerson("John Doe")
            .email("john@acme.com")
            .phone("555-1234")
            .address("123 Main St")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        stubSupplierService.setupCreateSupplier(responseDto);

        mockMvc.perform(post("/api/v1/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Acme Supplies"))
            .andExpect(jsonPath("$.email").value("john@acme.com"));
    }

    @Test
    void testCreateSupplier_ValidationError() throws Exception {
        CreateSupplierRequest request = CreateSupplierRequest.builder()
            .name("") // Invalid: blank
            .contactPerson("John Doe")
            .email("john@acme.com")
            .phone("555-1234")
            .address("123 Main St")
            .build();

        mockMvc.perform(post("/api/v1/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void testCreateSupplier_InvalidEmail() throws Exception {
        CreateSupplierRequest request = CreateSupplierRequest.builder()
            .name("Acme Supplies")
            .contactPerson("John Doe")
            .email("invalid-email") // Invalid email format
            .phone("555-1234")
            .address("123 Main St")
            .build();

        mockMvc.perform(post("/api/v1/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void testGetSupplier_Success() throws Exception {
        SupplierDTO responseDto = SupplierDTO.builder()
            .id(1L)
            .name("Acme Supplies")
            .contactPerson("John Doe")
            .email("john@acme.com")
            .phone("555-1234")
            .address("123 Main St")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        stubSupplierService.setupGetSupplier(1L, responseDto);

        mockMvc.perform(get("/api/v1/suppliers/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Acme Supplies"))
            .andExpect(jsonPath("$.email").value("john@acme.com"));
    }

    @Test
    void testGetSupplier_NotFound() throws Exception {
        stubSupplierService.setupThrowException(new IllegalArgumentException("Supplier not found: 999"));

        mockMvc.perform(get("/api/v1/suppliers/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Supplier not found: 999"));
    }

    @Test
    void testListSuppliers_Success() throws Exception {
        List<SupplierDTO> suppliers = Arrays.asList(
            SupplierDTO.builder()
                .id(1L)
                .name("Acme Supplies")
                .contactPerson("John Doe")
                .email("john@acme.com")
                .phone("555-1234")
                .address("123 Main St")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build(),
            SupplierDTO.builder()
                .id(2L)
                .name("Global Goods")
                .contactPerson("Jane Smith")
                .email("jane@global.com")
                .phone("555-5678")
                .address("456 Oak Ave")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build()
        );

        Page<SupplierDTO> page = new PageImpl<>(suppliers, PageRequest.of(0, 20), 2);
        stubSupplierService.setupListSuppliers(page);

        mockMvc.perform(get("/api/v1/suppliers")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].id").value(1))
            .andExpect(jsonPath("$.content[0].name").value("Acme Supplies"))
            .andExpect(jsonPath("$.content[1].id").value(2))
            .andExpect(jsonPath("$.content[1].name").value("Global Goods"));
    }

    @Test
    void testListSuppliers_EmptyList() throws Exception {
        Page<SupplierDTO> page = new PageImpl<>(new ArrayList<>(), PageRequest.of(0, 20), 0);
        stubSupplierService.setupListSuppliers(page);

        mockMvc.perform(get("/api/v1/suppliers")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    void testUpdateSupplier_Success() throws Exception {
        UpdateSupplierRequest request = UpdateSupplierRequest.builder()
            .name("Acme Supplies Inc")
            .contactPerson("Jane Doe")
            .build();

        SupplierDTO responseDto = SupplierDTO.builder()
            .id(1L)
            .name("Acme Supplies Inc")
            .contactPerson("Jane Doe")
            .email("john@acme.com")
            .phone("555-1234")
            .address("123 Main St")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        stubSupplierService.setupUpdateSupplier(responseDto);

        mockMvc.perform(put("/api/v1/suppliers/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Acme Supplies Inc"))
            .andExpect(jsonPath("$.contactPerson").value("Jane Doe"));
    }

    @Test
    void testUpdateSupplier_NotFound() throws Exception {
        UpdateSupplierRequest request = UpdateSupplierRequest.builder()
            .name("Updated Supplier")
            .build();

        stubSupplierService.setupThrowException(new IllegalArgumentException("Supplier not found: 999"));

        mockMvc.perform(put("/api/v1/suppliers/999")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Supplier not found: 999"));
    }

    @Test
    void testUpdateSupplier_ValidationError() throws Exception {
        UpdateSupplierRequest request = UpdateSupplierRequest.builder()
            .email("invalid-email") // Invalid: not a valid email
            .build();

        mockMvc.perform(put("/api/v1/suppliers/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void testDeleteSupplier_Success() throws Exception {
        stubSupplierService.setupDeleteSuccess();

        mockMvc.perform(delete("/api/v1/suppliers/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    void testDeleteSupplier_NotFound() throws Exception {
        stubSupplierService.setupThrowException(new IllegalArgumentException("Supplier not found: 999"));

        mockMvc.perform(delete("/api/v1/suppliers/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Supplier not found: 999"));
    }

    /**
     * Test stub for SupplierService - works around Java 25 mocking limitations
     */
    static class StubSupplierService extends SupplierService {
        private SupplierDTO supplierResponse;
        private Page<SupplierDTO> pageResponse;
        private RuntimeException exceptionToThrow;

        public StubSupplierService() {
            super(null);
        }

        void setupCreateSupplier(SupplierDTO dto) {
            this.supplierResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupGetSupplier(Long id, SupplierDTO dto) {
            this.supplierResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupListSuppliers(Page<SupplierDTO> page) {
            this.pageResponse = page;
        }

        void setupUpdateSupplier(SupplierDTO dto) {
            this.supplierResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupDeleteSuccess() {
            this.exceptionToThrow = null;
        }

        void setupThrowException(RuntimeException ex) {
            this.exceptionToThrow = ex;
        }

        @Override
        public SupplierDTO createSupplier(CreateSupplierRequest request) {
            throwIfNeeded();
            return supplierResponse;
        }

        @Override
        public SupplierDTO getSupplier(Long id) {
            throwIfNeeded();
            return supplierResponse;
        }

        @Override
        public Page<SupplierDTO> listSuppliers(Pageable pageable) {
            throwIfNeeded();
            return pageResponse != null ? pageResponse : new PageImpl<>(new ArrayList<>());
        }

        @Override
        public SupplierDTO updateSupplier(Long id, UpdateSupplierRequest request) {
            throwIfNeeded();
            return supplierResponse;
        }

        @Override
        public void deleteSupplier(Long id) {
            throwIfNeeded();
        }

        private void throwIfNeeded() {
            if (exceptionToThrow != null) {
                throw exceptionToThrow;
            }
        }
    }
}
