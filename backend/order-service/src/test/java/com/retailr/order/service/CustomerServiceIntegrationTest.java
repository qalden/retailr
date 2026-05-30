package com.retailr.order.service;

import com.retailr.order.dto.CreateCustomerRequest;
import com.retailr.order.dto.CustomerDTO;
import com.retailr.order.dto.UpdateCustomerRequest;
import com.retailr.order.entity.Customer;
import com.retailr.order.exception.CustomerNotFoundException;
import com.retailr.order.exception.DuplicateEmailException;
import com.retailr.order.repository.CustomerRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CustomerServiceIntegrationTest {
    @Autowired
    private CustomerService customerService;

    @Autowired
    private CustomerRepository customerRepository;

    private CustomerDTO testCustomerDto;

    @BeforeEach
    void setUp() {
        customerRepository.deleteAll();
        testCustomerDto = CustomerDTO.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("555-1234")
                .address("123 Main St")
                .city("Springfield")
                .postalCode("12345")
                .build();
    }

    @AfterEach
    void tearDown() {
        customerRepository.deleteAll();
    }

    @Test
    void testCreateCustomer_Success() {
        // Given
        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name(testCustomerDto.getName())
                .email(testCustomerDto.getEmail())
                .phone(testCustomerDto.getPhone())
                .address(testCustomerDto.getAddress())
                .city(testCustomerDto.getCity())
                .postalCode(testCustomerDto.getPostalCode())
                .build();

        // When
        CustomerDTO createdCustomer = customerService.createCustomer(request);

        // Then
        assertThat(createdCustomer).isNotNull();
        assertThat(createdCustomer.getId()).isNotNull();
        assertThat(createdCustomer.getName()).isEqualTo("John Doe");
        assertThat(createdCustomer.getEmail()).isEqualTo("john@example.com");
        assertThat(createdCustomer.getPhone()).isEqualTo("555-1234");
        assertThat(createdCustomer.getAddress()).isEqualTo("123 Main St");
        assertThat(createdCustomer.getCity()).isEqualTo("Springfield");
        assertThat(createdCustomer.getPostalCode()).isEqualTo("12345");
        assertThat(createdCustomer.getCreatedAt()).isNotNull();

        // Verify in database
        long count = customerRepository.count();
        assertThat(count).isEqualTo(1);
    }

    @Test
    void testCreateCustomer_DuplicateEmail() {
        // Given
        CreateCustomerRequest request1 = CreateCustomerRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("555-1234")
                .build();

        CreateCustomerRequest request2 = CreateCustomerRequest.builder()
                .name("Jane Doe")
                .email("john@example.com")  // Duplicate email
                .phone("555-5678")
                .build();

        // When
        customerService.createCustomer(request1);

        // Then
        assertThatThrownBy(() -> customerService.createCustomer(request2))
                .isInstanceOf(DuplicateEmailException.class)
                .hasMessageContaining("Email already in use");
    }

    @Test
    void testGetCustomer_Success() {
        // Given
        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("555-1234")
                .build();

        CustomerDTO created = customerService.createCustomer(request);

        // When
        CustomerDTO retrieved = customerService.getCustomer(created.getId());

        // Then
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getId()).isEqualTo(created.getId());
        assertThat(retrieved.getName()).isEqualTo("John Doe");
        assertThat(retrieved.getEmail()).isEqualTo("john@example.com");
    }

    @Test
    void testGetCustomer_NotFound() {
        // When & Then
        assertThatThrownBy(() -> customerService.getCustomer(999L))
                .isInstanceOf(CustomerNotFoundException.class)
                .hasMessageContaining("Customer not found with id: 999");
    }

    @Test
    void testGetAllCustomers_Pagination() {
        // Given
        for (int i = 0; i < 5; i++) {
            CreateCustomerRequest request = CreateCustomerRequest.builder()
                    .name("Customer " + i)
                    .email("customer" + i + "@example.com")
                    .phone("555-" + String.format("%04d", 1000 + i))
                    .build();
            customerService.createCustomer(request);
        }

        // When
        Pageable pageable = PageRequest.of(0, 3);
        Page<CustomerDTO> page = customerService.getAllCustomers(pageable);

        // Then
        assertThat(page).isNotNull();
        assertThat(page.getTotalElements()).isEqualTo(5);
        assertThat(page.getContent()).hasSize(3);
        assertThat(page.getTotalPages()).isEqualTo(2);
        assertThat(page.isFirst()).isTrue();
        assertThat(page.hasNext()).isTrue();
    }

    @Test
    void testUpdateCustomer_Success() {
        // Given
        CreateCustomerRequest createRequest = CreateCustomerRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("555-1234")
                .address("123 Main St")
                .city("Springfield")
                .build();

        CustomerDTO created = customerService.createCustomer(createRequest);

        UpdateCustomerRequest updateRequest = UpdateCustomerRequest.builder()
                .name("John Smith")
                .email("john.smith@example.com")
                .phone("555-5678")
                .address("456 Oak Ave")
                .city("Shelbyville")
                .build();

        // When
        CustomerDTO updated = customerService.updateCustomer(created.getId(), updateRequest);

        // Then
        assertThat(updated).isNotNull();
        assertThat(updated.getName()).isEqualTo("John Smith");
        assertThat(updated.getEmail()).isEqualTo("john.smith@example.com");
        assertThat(updated.getPhone()).isEqualTo("555-5678");
        assertThat(updated.getAddress()).isEqualTo("456 Oak Ave");
        assertThat(updated.getCity()).isEqualTo("Shelbyville");

        // Verify in database
        Customer dbCustomer = customerRepository.findById(created.getId()).orElseThrow();
        assertThat(dbCustomer.getName()).isEqualTo("John Smith");
    }

    @Test
    void testUpdateCustomer_DuplicateEmail() {
        // Given
        CreateCustomerRequest request1 = CreateCustomerRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .build();

        CreateCustomerRequest request2 = CreateCustomerRequest.builder()
                .name("Jane Doe")
                .email("jane@example.com")
                .build();

        CustomerDTO customer1 = customerService.createCustomer(request1);
        CustomerDTO customer2 = customerService.createCustomer(request2);

        UpdateCustomerRequest updateRequest = UpdateCustomerRequest.builder()
                .email("john@example.com")  // Duplicate of customer1
                .build();

        // When & Then
        assertThatThrownBy(() -> customerService.updateCustomer(customer2.getId(), updateRequest))
                .isInstanceOf(DuplicateEmailException.class)
                .hasMessageContaining("Email already in use");
    }

    @Test
    void testDeleteCustomer_Success() {
        // Given
        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .build();

        CustomerDTO created = customerService.createCustomer(request);
        assertThat(customerRepository.count()).isEqualTo(1);

        // When
        customerService.deleteCustomer(created.getId());

        // Then
        assertThat(customerRepository.count()).isEqualTo(0);
        assertThatThrownBy(() -> customerService.getCustomer(created.getId()))
                .isInstanceOf(CustomerNotFoundException.class);
    }

    @Test
    void testDeleteCustomer_NotFound() {
        // When & Then
        assertThatThrownBy(() -> customerService.deleteCustomer(999L))
                .isInstanceOf(CustomerNotFoundException.class)
                .hasMessageContaining("Customer not found with id: 999");
    }
}
