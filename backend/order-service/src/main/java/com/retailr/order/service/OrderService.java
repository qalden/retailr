package com.retailr.order.service;

import com.retailr.order.dto.CreateOrderRequest;
import com.retailr.order.dto.OrderDTO;
import com.retailr.order.dto.OrderLineDTO;
import com.retailr.order.entity.Customer;
import com.retailr.order.entity.Order;
import com.retailr.order.entity.OrderLine;
import com.retailr.order.entity.OrderStatus;
import com.retailr.order.exception.CustomerNotFoundException;
import com.retailr.order.exception.OrderNotFoundException;
import com.retailr.order.repository.CustomerRepository;
import com.retailr.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final OrderLineService orderLineService;
    private final OrderStockReservationService orderStockReservationService;

    @Transactional
    public OrderDTO createOrder(CreateOrderRequest request) {
        // Validate customer exists
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> {
                    log.debug("Customer not found with id: {}", request.getCustomerId());
                    return new CustomerNotFoundException("Customer not found with id: " + request.getCustomerId());
                });

        // Create order with DRAFT status
        String orderNumber = generateOrderNumber();
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customer(customer)
                .status(OrderStatus.DRAFT)
                .totalAmount(BigDecimal.ZERO)
                .build();

        Order savedOrder = orderRepository.save(order);

        // Create order lines
        List<OrderLine> orderLines = orderLineService.createOrderLines(
                savedOrder,
                request.getLines()
        );
        savedOrder.setOrderLines(orderLines);

        // Calculate and update total amount
        BigDecimal totalAmount = calculateOrderTotal(orderLines);
        savedOrder.setTotalAmount(totalAmount);

        Order finalOrder = orderRepository.save(savedOrder);
        log.info("Order created with id: {}, orderNumber: {}, customerId: {}",
                finalOrder.getId(), finalOrder.getOrderNumber(), customer.getId());

        return mapToDTO(finalOrder);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> {
                    log.debug("Order not found with id: {}", orderId);
                    return new OrderNotFoundException("Order not found with id: " + orderId);
                });
        return mapToDTO(order);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> {
                    log.debug("Order not found with orderNumber: {}", orderNumber);
                    return new OrderNotFoundException("Order not found with orderNumber: " + orderNumber);
                });
        return mapToDTO(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderDTO> getCustomerOrders(Long customerId, Pageable pageable) {
        // Validate customer exists
        if (!customerRepository.existsById(customerId)) {
            log.debug("Customer not found with id: {}", customerId);
            throw new CustomerNotFoundException("Customer not found with id: " + customerId);
        }

        log.debug("Fetching orders for customer id: {} with pagination", customerId);
        List<Order> allOrders = orderRepository.findByCustomerId(customerId);
        List<OrderDTO> dtos = allOrders.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), dtos.size());

        List<OrderDTO> pageContent = dtos.subList(start, end);
        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, dtos.size());
    }

    @Transactional
    public OrderDTO confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> {
                    log.debug("Order not found with id: {}", orderId);
                    return new OrderNotFoundException("Order not found with id: " + orderId);
                });

        // Reserve stock for all lines
        orderStockReservationService.reserveStockForOrder(order);

        // Update status and timestamp
        order.setStatus(OrderStatus.CONFIRMED);
        order.setConfirmedAt(LocalDateTime.now());

        Order confirmedOrder = orderRepository.save(order);
        log.info("Order confirmed with id: {}, orderNumber: {}", confirmedOrder.getId(), confirmedOrder.getOrderNumber());

        return mapToDTO(confirmedOrder);
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> {
                    log.debug("Order not found with id: {}", orderId);
                    return new OrderNotFoundException("Order not found with id: " + orderId);
                });

        order.setStatus(newStatus);

        // Set appropriate timestamp based on status
        switch (newStatus) {
            case CONFIRMED:
                order.setConfirmedAt(LocalDateTime.now());
                break;
            case FULFILLED:
                order.setFulfilledAt(LocalDateTime.now());
                break;
            case CANCELLED:
                order.setCancelledAt(LocalDateTime.now());
                break;
            case DRAFT:
                // Draft doesn't have a specific timestamp
                break;
        }

        Order updatedOrder = orderRepository.save(order);
        log.info("Order status updated: orderId={}, orderNumber={}, newStatus={}",
                updatedOrder.getId(), updatedOrder.getOrderNumber(), newStatus);

        return mapToDTO(updatedOrder);
    }

    @Transactional
    public OrderDTO cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> {
                    log.debug("Order not found with id: {}", orderId);
                    return new OrderNotFoundException("Order not found with id: " + orderId);
                });

        // Release stock reservations
        orderStockReservationService.releaseStockReservations(orderId);

        // Update status and timestamp
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());

        Order cancelledOrder = orderRepository.save(order);
        log.info("Order cancelled with id: {}, orderNumber: {}", cancelledOrder.getId(), cancelledOrder.getOrderNumber());

        return mapToDTO(cancelledOrder);
    }

    @Transactional
    public void deleteOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> {
                    log.debug("Order not found with id: {}", orderId);
                    return new OrderNotFoundException("Order not found with id: " + orderId);
                });

        // Soft delete: only allow deletion if order is in DRAFT status
        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new OrderNotFoundException("Can only delete orders in DRAFT status");
        }

        // Delete order lines first (cascade will handle this, but explicit is better)
        orderLineService.deleteOrderLines(orderId);

        // Delete the order
        orderRepository.delete(order);
        log.info("Order deleted with id: {}", orderId);
    }

    private BigDecimal calculateOrderTotal(List<OrderLine> orderLines) {
        return orderLines.stream()
                .map(OrderLine::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String generateOrderNumber() {
        return "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private OrderDTO mapToDTO(Order order) {
        List<OrderLineDTO> linesDTOs = order.getOrderLines().stream()
                .map(line -> OrderLineDTO.builder()
                        .id(line.getId())
                        .productId(line.getProductId())
                        .quantity(line.getQuantity())
                        .unitPrice(line.getUnitPrice())
                        .lineTotal(line.getLineTotal())
                        .build())
                .collect(Collectors.toList());

        return OrderDTO.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .createdAt(order.getCreatedAt())
                .confirmedAt(order.getConfirmedAt())
                .fulfilledAt(order.getFulfilledAt())
                .cancelledAt(order.getCancelledAt())
                .updatedAt(order.getUpdatedAt())
                .lines(linesDTOs)
                .build();
    }
}
