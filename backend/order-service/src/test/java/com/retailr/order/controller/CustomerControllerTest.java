package com.retailr.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailr.order.dto.CreateCustomerRequest;
import com.retailr.order.dto.CustomerDTO;
import com.retailr.order.dto.UpdateCustomerRequest;
import com.retailr.order.exception.CustomerNotFoundException;
import com.retailr.order.exception.DuplicateEmailException;
import com.retailr.order.exception.GlobalExceptionHandler;
import com.retailr.order.service.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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

class CustomerControllerTest {
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private StubCustomerService stubCustomerService;

    @BeforeEach
    void setUp() {
        stubCustomerService = new StubCustomerService();
        CustomerController controller = new CustomerController(stubCustomerService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testCreateCustomer_Success() throws Exception {
        CreateCustomerRequest request = CreateCustomerRequest.builder()
            .name("John Doe")
            .email("john@example.com")
            .phone("555-1234")
            .address("123 Main St")
            .city("Springfield")
            .postalCode("12345")
            .build();

        CustomerDTO responseDto = CustomerDTO.builder()
            .id(1L)
            .name("John Doe")
            .email("john@example.com")
            .phone("555-1234")
            .address("123 Main St")
            .city("Springfield")
            .postalCode("12345")
            .createdAt(LocalDateTime.now())
            .build();

        stubCustomerService.setupCreateCustomer(responseDto);

        mockMvc.perform(post("/api/v1/customers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("John Doe"))
            .andExpect(jsonPath("$.email").value("john@example.com"));
    }

    @Test
    void testCreateCustomer_ValidationError() throws Exception {
        CreateCustomerRequest request = CreateCustomerRequest.builder()
            .name("")  // Invalid: blank
            .email("john@example.com")
            .phone("555-1234")
            .build();

        mockMvc.perform(post("/api/v1/customers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void testCreateCustomer_DuplicateEmail() throws Exception {
        CreateCustomerRequest request = CreateCustomerRequest.builder()
            .name("John Doe")
            .email("john@example.com")
            .phone("555-1234")
            .build();

        stubCustomerService.setupThrowException(
            new DuplicateEmailException("Email already in use")
        );

        mockMvc.perform(post("/api/v1/customers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("ORDER_ERROR"))
            .andExpect(jsonPath("$.message").value("Email already in use"));
    }

    @Test
    void testGetCustomer_Success() throws Exception {
        CustomerDTO responseDto = CustomerDTO.builder()
            .id(1L)
            .name("John Doe")
            .email("john@example.com")
            .phone("555-1234")
            .address("123 Main St")
            .city("Springfield")
            .postalCode("12345")
            .createdAt(LocalDateTime.now())
            .build();

        stubCustomerService.setupGetCustomer(1L, responseDto);

        mockMvc.perform(get("/api/v1/customers/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("John Doe"))
            .andExpect(jsonPath("$.email").value("john@example.com"));
    }

    @Test
    void testGetCustomer_NotFound() throws Exception {
        stubCustomerService.setupThrowException(
            new CustomerNotFoundException("Customer not found with id: 999")
        );

        mockMvc.perform(get("/api/v1/customers/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("CUSTOMER_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Customer not found with id: 999"));
    }

    @Test
    void testGetAllCustomers_Success() throws Exception {
        List<CustomerDTO> customers = Arrays.asList(
            CustomerDTO.builder()
                .id(1L)
                .name("John Doe")
                .email("john@example.com")
                .phone("555-1234")
                .city("Springfield")
                .createdAt(LocalDateTime.now())
                .build(),
            CustomerDTO.builder()
                .id(2L)
                .name("Jane Smith")
                .email("jane@example.com")
                .phone("555-5678")
                .city("Shelbyville")
                .createdAt(LocalDateTime.now())
                .build()
        );

        Page<CustomerDTO> page = new PageImpl<>(customers, PageRequest.of(0, 20), 2);
        stubCustomerService.setupGetAllCustomers(page);

        mockMvc.perform(get("/api/v1/customers")
            .param("page", "0")
            .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].id").value(1))
            .andExpect(jsonPath("$.content[0].name").value("John Doe"))
            .andExpect(jsonPath("$.content[1].id").value(2))
            .andExpect(jsonPath("$.content[1].name").value("Jane Smith"));
    }

    @Test
    void testUpdateCustomer_Success() throws Exception {
        UpdateCustomerRequest request = UpdateCustomerRequest.builder()
            .name("John Updated")
            .email("john.updated@example.com")
            .build();

        CustomerDTO responseDto = CustomerDTO.builder()
            .id(1L)
            .name("John Updated")
            .email("john.updated@example.com")
            .phone("555-1234")
            .address("123 Main St")
            .city("Springfield")
            .postalCode("12345")
            .createdAt(LocalDateTime.now())
            .build();

        stubCustomerService.setupUpdateCustomer(responseDto);

        mockMvc.perform(put("/api/v1/customers/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("John Updated"))
            .andExpect(jsonPath("$.email").value("john.updated@example.com"));
    }

    @Test
    void testUpdateCustomer_NotFound() throws Exception {
        UpdateCustomerRequest request = UpdateCustomerRequest.builder()
            .name("John Updated")
            .build();

        stubCustomerService.setupThrowException(
            new CustomerNotFoundException("Customer not found with id: 999")
        );

        mockMvc.perform(put("/api/v1/customers/999")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("CUSTOMER_NOT_FOUND"));
    }

    @Test
    void testDeleteCustomer_Success() throws Exception {
        stubCustomerService.setupDeleteSuccess();

        mockMvc.perform(delete("/api/v1/customers/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    void testDeleteCustomer_NotFound() throws Exception {
        stubCustomerService.setupThrowException(
            new CustomerNotFoundException("Customer not found with id: 999")
        );

        mockMvc.perform(delete("/api/v1/customers/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("CUSTOMER_NOT_FOUND"));
    }

    static class StubCustomerService extends CustomerService {
        private CustomerDTO customerResponse;
        private Page<CustomerDTO> pageResponse;
        private RuntimeException exceptionToThrow;

        StubCustomerService() {
            super(null);
        }

        void setupCreateCustomer(CustomerDTO dto) {
            this.customerResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupGetCustomer(Long id, CustomerDTO dto) {
            this.customerResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupGetAllCustomers(Page<CustomerDTO> page) {
            this.pageResponse = page;
        }

        void setupUpdateCustomer(CustomerDTO dto) {
            this.customerResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupDeleteSuccess() {
            this.exceptionToThrow = null;
        }

        void setupThrowException(RuntimeException ex) {
            this.exceptionToThrow = ex;
        }

        @Override
        public CustomerDTO createCustomer(CreateCustomerRequest request) {
            throwIfNeeded();
            return customerResponse;
        }

        @Override
        public CustomerDTO getCustomer(Long customerId) {
            throwIfNeeded();
            return customerResponse;
        }

        @Override
        public Page<CustomerDTO> getAllCustomers(org.springframework.data.domain.Pageable pageable) {
            throwIfNeeded();
            return pageResponse != null ? pageResponse : new PageImpl<>(new ArrayList<>());
        }

        @Override
        public CustomerDTO updateCustomer(Long customerId, UpdateCustomerRequest request) {
            throwIfNeeded();
            return customerResponse;
        }

        @Override
        public void deleteCustomer(Long customerId) {
            throwIfNeeded();
        }

        private void throwIfNeeded() {
            if (exceptionToThrow != null) {
                throw exceptionToThrow;
            }
        }
    }
}
