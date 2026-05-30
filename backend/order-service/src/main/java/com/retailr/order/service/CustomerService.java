package com.retailr.order.service;

import com.retailr.order.dto.CreateCustomerRequest;
import com.retailr.order.dto.CustomerDTO;
import com.retailr.order.dto.UpdateCustomerRequest;
import com.retailr.order.entity.Customer;
import com.retailr.order.exception.CustomerNotFoundException;
import com.retailr.order.exception.DuplicateEmailException;
import com.retailr.order.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {
    private final CustomerRepository customerRepository;

    @Transactional
    public CustomerDTO createCustomer(CreateCustomerRequest request) {
        // Check email uniqueness
        if (customerRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateEmailException("Email already in use");
        }

        Customer customer = Customer.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .city(request.getCity())
                .postalCode(request.getPostalCode())
                .build();

        Customer savedCustomer = customerRepository.save(customer);
        log.info("Customer created with id: {}, email: {}", savedCustomer.getId(), savedCustomer.getEmail());

        return mapToDTO(savedCustomer);
    }

    @Transactional(readOnly = true)
    public CustomerDTO getCustomer(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.debug("Customer not found with id: {}", customerId);
                    return new CustomerNotFoundException("Customer not found with id: " + customerId);
                });
        return mapToDTO(customer);
    }

    @Transactional(readOnly = true)
    public Page<CustomerDTO> getAllCustomers(Pageable pageable) {
        log.debug("Fetching all customers with pagination");
        return customerRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Transactional
    public CustomerDTO updateCustomer(Long customerId, UpdateCustomerRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.debug("Customer not found with id: {}", customerId);
                    return new CustomerNotFoundException("Customer not found with id: " + customerId);
                });

        // Check email uniqueness if email is being updated
        if (request.getEmail() != null && !request.getEmail().equals(customer.getEmail())) {
            if (customerRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new DuplicateEmailException("Email already in use");
            }
        }

        // Update only non-null fields
        if (request.getName() != null) {
            customer.setName(request.getName());
        }
        if (request.getEmail() != null) {
            customer.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            customer.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            customer.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            customer.setCity(request.getCity());
        }
        if (request.getPostalCode() != null) {
            customer.setPostalCode(request.getPostalCode());
        }

        Customer updatedCustomer = customerRepository.save(customer);
        log.info("Customer updated with id: {}", updatedCustomer.getId());

        return mapToDTO(updatedCustomer);
    }

    @Transactional
    public void deleteCustomer(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> {
                    log.debug("Customer not found with id: {}", customerId);
                    return new CustomerNotFoundException("Customer not found with id: " + customerId);
                });

        customerRepository.delete(customer);
        log.info("Customer deleted with id: {}", customerId);
    }

    private CustomerDTO mapToDTO(Customer customer) {
        return CustomerDTO.builder()
                .id(customer.getId())
                .name(customer.getName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .city(customer.getCity())
                .postalCode(customer.getPostalCode())
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
