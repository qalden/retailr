package com.retailr.order.controller;

import com.retailr.order.dto.CreateOrderRequest;
import com.retailr.order.dto.OrderDTO;
import com.retailr.order.dto.UpdateOrderStatusRequest;
import com.retailr.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@Slf4j
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        log.info("Creating order for customer: {}", request.getCustomerId());
        OrderDTO order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrder(@PathVariable Long id) {
        log.debug("Fetching order: {}", id);
        OrderDTO order = orderService.getOrder(id);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<OrderDTO> getOrderByNumber(@PathVariable String orderNumber) {
        log.debug("Fetching order by number: {}", orderNumber);
        OrderDTO order = orderService.getOrderByNumber(orderNumber);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/customers/{customerId}")
    public ResponseEntity<Page<OrderDTO>> getCustomerOrders(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.debug("Fetching orders for customer: {}", customerId);
        validatePagination(page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderDTO> orders = orderService.getCustomerOrders(customerId, pageable);
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<OrderDTO> confirmOrder(@PathVariable Long id) {
        log.info("Confirming order: {}", id);
        OrderDTO order = orderService.confirmOrder(id);
        return ResponseEntity.ok(order);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderDTO> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        log.info("Updating order {} status to {}", id, request.getStatus());
        OrderDTO order = orderService.updateOrderStatus(id, request.getStatus());
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderDTO> cancelOrder(@PathVariable Long id) {
        log.info("Cancelling order: {}", id);
        OrderDTO order = orderService.cancelOrder(id);
        return ResponseEntity.ok(order);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        log.info("Deleting order: {}", id);
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }

    private void validatePagination(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Page index must be greater than or equal to 0");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("Page size must be greater than 0");
        }
        if (size > PaginationConstants.MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("Page size must be less than or equal to " + PaginationConstants.MAX_PAGE_SIZE);
        }
    }
}
