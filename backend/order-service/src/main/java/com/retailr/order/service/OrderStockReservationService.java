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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderStockReservationService {
    private final OrderStockReservationRepository orderStockReservationRepository;
    private final RestTemplate restTemplate;

    private static final String CATALOG_SERVICE_URL = "http://localhost:8082/api/v1/products";

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

                org.springframework.http.ResponseEntity<Map> response = restTemplate.getForEntity(stockUrl, Map.class);
                Map<String, Object> stockData = response.getBody();

                Integer availableQuantity = 0;
                if (stockData != null && stockData.containsKey("availableQuantity")) {
                    availableQuantity = ((Number) stockData.get("availableQuantity")).intValue();
                }

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
                log.warn("Catalog Service unavailable, cannot reserve stock", e);
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

                    Map<String, Object> releaseRequest = new HashMap<>();
                    releaseRequest.put("warehouseId", reservation.getWarehouseId());
                    releaseRequest.put("quantity", reservation.getReservedQuantity());
                    restTemplate.postForEntity(releaseUrl, releaseRequest, Void.class);

                    // Mark reservation as released
                    reservation.setReleasedAt(LocalDateTime.now());
                    log.info("Released stock reservation for order {}", orderId);

                } catch (RestClientException e) {
                    log.warn("Failed to release stock in Catalog Service for reservation {}", reservation.getId(), e);
                }
            }
        }
        orderStockReservationRepository.saveAll(reservations);
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
