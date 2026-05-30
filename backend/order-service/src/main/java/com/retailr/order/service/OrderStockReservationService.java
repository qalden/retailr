package com.retailr.order.service;

import com.retailr.order.dto.OrderStockReservationDTO;
import com.retailr.order.entity.Order;
import com.retailr.order.entity.OrderLine;
import com.retailr.order.entity.OrderStockReservation;
import com.retailr.order.exception.InsufficientStockException;
import com.retailr.order.repository.OrderStockReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderStockReservationService {
    private final OrderStockReservationRepository orderStockReservationRepository;
    private final RestTemplate restTemplate;

    private static final String CATALOG_SERVICE_URL = "http://localhost:8081/api/v1/products";

    @Transactional
    public void reserveStockForOrder(Order order) {
        List<OrderLine> orderLines = order.getOrderLines();

        for (OrderLine line : orderLines) {
            // For now, we'll use a default warehouse ID of 1
            // In a real scenario, this would be determined by business logic
            Long warehouseId = 1L;

            try {
                // Call Catalog Service to check stock availability
                String stockUrl = CATALOG_SERVICE_URL + "/" + line.getProductId() + "/stock?warehouseId=" + warehouseId;
                log.debug("Checking stock availability at: {}", stockUrl);

                // This would normally return a ProductStockDTO with availableQuantity
                // For now, we'll assume the catalog service returns the available quantity
                // In a real implementation, you'd use a RestTemplate exchange call
                // Integer availableQuantity = restTemplate.getForObject(stockUrl, ProductStockDTO.class).getAvailableQuantity();

                // For demonstration, we assume stock is available
                // In production, the actual check would happen here
                Integer availableQuantity = line.getQuantity() + 100; // Mock: assume stock is available

                if (availableQuantity < line.getQuantity()) {
                    log.warn("Insufficient stock for product {} in warehouse {}: required={}, available={}",
                            line.getProductId(), warehouseId, line.getQuantity(), availableQuantity);
                    throw new InsufficientStockException(
                            "Insufficient stock for product " + line.getProductId() +
                                    ": required " + line.getQuantity() + ", available " + availableQuantity);
                }

                // Create reservation record
                OrderStockReservation reservation = OrderStockReservation.builder()
                        .order(order)
                        .productId(line.getProductId())
                        .warehouseId(warehouseId)
                        .reservedQuantity(line.getQuantity())
                        .build();

                orderStockReservationRepository.save(reservation);
                log.info("Stock reserved for order {}: productId={}, warehouseId={}, quantity={}",
                        order.getId(), line.getProductId(), warehouseId, line.getQuantity());

            } catch (RestClientException e) {
                log.error("Catalog Service unavailable when reserving stock for product {}", line.getProductId(), e);
                throw new InsufficientStockException(
                        "Unable to check stock availability - Catalog Service is unavailable");
            }
        }
    }

    @Transactional
    public void releaseStockReservations(Long orderId) {
        List<OrderStockReservation> reservations = orderStockReservationRepository.findByOrderId(orderId);

        for (OrderStockReservation reservation : reservations) {
            if (reservation.getReleasedAt() == null) {
                try {
                    // Call Catalog Service to release stock
                    String releaseUrl = CATALOG_SERVICE_URL + "/" + reservation.getProductId() + "/stock/release";
                    log.debug("Releasing stock at: {}", releaseUrl);

                    // In a real implementation, you'd POST to this endpoint with warehouseId and quantity
                    // restTemplate.postForObject(releaseUrl, releaseRequest, String.class);

                    // Mark reservation as released
                    reservation.setReleasedAt(LocalDateTime.now());
                    orderStockReservationRepository.save(reservation);

                    log.info("Stock released for order {}: productId={}, warehouseId={}, quantity={}",
                            orderId, reservation.getProductId(), reservation.getWarehouseId(),
                            reservation.getReservedQuantity());

                } catch (RestClientException e) {
                    log.warn("Catalog Service unavailable when releasing stock for order {}", orderId, e);
                    // Don't throw exception here - partial releases are acceptable
                    // In production, you might use a message queue for async releases
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<OrderStockReservationDTO> getReservationsByOrder(Long orderId) {
        log.debug("Fetching reservations for order id: {}", orderId);
        return orderStockReservationRepository.findByOrderId(orderId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private OrderStockReservationDTO mapToDTO(OrderStockReservation reservation) {
        return OrderStockReservationDTO.builder()
                .id(reservation.getId())
                .orderId(reservation.getOrder().getId())
                .productId(reservation.getProductId())
                .warehouseId(reservation.getWarehouseId())
                .reservedQuantity(reservation.getReservedQuantity())
                .releasedAt(reservation.getReleasedAt())
                .build();
    }
}
