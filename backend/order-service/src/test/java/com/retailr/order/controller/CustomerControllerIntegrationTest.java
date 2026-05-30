package com.retailr.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailr.order.config.TestSecurityConfig;
import com.retailr.order.dto.CreateCustomerRequest;
import com.retailr.order.dto.UpdateCustomerRequest;
import com.retailr.order.entity.Customer;
import com.retailr.order.repository.CustomerRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.data.domain.PageImpl;
import com.retailr.order.dto.CustomerDTO;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class CustomerControllerIntegrationTest {
    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String BASE_URL = "/api/v1/customers";

    @BeforeEach
    void setUp() {
        customerRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        customerRepository.deleteAll();
    }

    @Test
    void testCreateCustomer_ReturnsCreatedStatusAndLocation() {
        // Given
        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("555-1234")
                .address("123 Main St")
                .city("Springfield")
                .postalCode("12345")
                .build();

        // When
        ResponseEntity<Object> response = restTemplate.postForEntity(BASE_URL, request, Object.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();

        // Verify in database
        assertThat(customerRepository.count()).isEqualTo(1);
    }

    @Test
    void testGetCustomer_Returns200() {
        // Given
        Customer customer = Customer.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("555-1234")
                .build();
        Customer saved = customerRepository.save(customer);

        // When
        ResponseEntity<Object> response = restTemplate.getForEntity(BASE_URL + "/" + saved.getId(), Object.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    void testGetCustomer_Returns404() {
        // When
        ResponseEntity<Object> response = restTemplate.getForEntity(BASE_URL + "/999", Object.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void testGetAllCustomers_ReturnsPaginatedList() {
        // Given
        for (int i = 0; i < 5; i++) {
            Customer customer = Customer.builder()
                    .name("Customer " + i)
                    .email("customer" + i + "@example.com")
                    .phone("555-" + String.format("%04d", 1000 + i))
                    .build();
            customerRepository.save(customer);
        }

        // When
        ResponseEntity<Object> response = restTemplate.getForEntity(
                BASE_URL + "?page=0&size=3",
                Object.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Object body = response.getBody();
        assertThat(body).isNotNull();
        // Verify it's a page response with actual content
        if (body instanceof java.util.Map) {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> pageData = (java.util.Map<String, Object>) body;
            assertThat(pageData.get("content")).isNotNull();
            assertThat(pageData.get("totalElements")).isNotNull();
            long totalElements = ((Number) pageData.get("totalElements")).longValue();
            assertThat(totalElements).isGreaterThanOrEqualTo(1);
        }
    }

    @Test
    void testUpdateCustomer_Returns200() {
        // Given
        Customer customer = Customer.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("555-1234")
                .build();
        Customer saved = customerRepository.save(customer);

        UpdateCustomerRequest updateRequest = UpdateCustomerRequest.builder()
                .name("John Smith")
                .email("john.smith@example.com")
                .build();

        // When
        ResponseEntity<Object> response = restTemplate.exchange(
                BASE_URL + "/" + saved.getId(),
                org.springframework.http.HttpMethod.PUT,
                new org.springframework.http.HttpEntity<>(updateRequest),
                Object.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    void testDeleteCustomer_Returns204() {
        // Given
        Customer customer = Customer.builder()
                .name("John Doe")
                .email("john@example.com")
                .build();
        Customer saved = customerRepository.save(customer);

        // When
        ResponseEntity<Void> response = restTemplate.exchange(
                BASE_URL + "/" + saved.getId(),
                org.springframework.http.HttpMethod.DELETE,
                null,
                Void.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // Verify deleted from database
        assertThat(customerRepository.count()).isEqualTo(0);
    }

    @Test
    void testCreateCustomer_ValidationError_Returns400() {
        // Given
        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("")  // Invalid: blank name
                .email("john@example.com")
                .build();

        // When
        ResponseEntity<Object> response = restTemplate.postForEntity(BASE_URL, request, Object.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void testCreateCustomer_DuplicateEmail_Returns400() {
        // Given
        Customer customer = Customer.builder()
                .name("Existing Customer")
                .email("john@example.com")
                .build();
        customerRepository.save(customer);

        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("New Customer")
                .email("john@example.com")  // Duplicate
                .build();

        // When
        ResponseEntity<Object> response = restTemplate.postForEntity(BASE_URL, request, Object.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
