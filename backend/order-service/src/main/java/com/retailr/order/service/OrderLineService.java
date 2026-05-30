package com.retailr.order.service;

import com.retailr.order.dto.CreateOrderLineRequest;
import com.retailr.order.dto.OrderLineDTO;
import com.retailr.order.entity.Order;
import com.retailr.order.entity.OrderLine;
import com.retailr.order.repository.OrderLineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderLineService {
    private final OrderLineRepository orderLineRepository;

    @Transactional
    public List<OrderLine> createOrderLines(Order order, List<CreateOrderLineRequest> lineRequests) {
        List<OrderLine> orderLines = lineRequests.stream()
                .map(request -> {
                    BigDecimal lineTotal = request.getUnitPrice()
                            .multiply(BigDecimal.valueOf(request.getQuantity()));

                    OrderLine orderLine = OrderLine.builder()
                            .order(order)
                            .productId(request.getProductId())
                            .quantity(request.getQuantity())
                            .unitPrice(request.getUnitPrice())
                            .lineTotal(lineTotal)
                            .build();

                    log.debug("Created order line for order {}: productId={}, quantity={}, unitPrice={}",
                            order.getId(), request.getProductId(), request.getQuantity(), request.getUnitPrice());

                    return orderLine;
                })
                .collect(Collectors.toList());

        return orderLineRepository.saveAll(orderLines);
    }

    @Transactional(readOnly = true)
    public List<OrderLineDTO> getOrderLines(Long orderId) {
        log.debug("Fetching order lines for order id: {}", orderId);
        return orderLineRepository.findByOrderId(orderId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteOrderLines(Long orderId) {
        List<OrderLine> lines = orderLineRepository.findByOrderId(orderId);
        orderLineRepository.deleteAll(lines);
        log.debug("Deleted {} order lines for order id: {}", lines.size(), orderId);
    }

    private OrderLineDTO mapToDTO(OrderLine orderLine) {
        return OrderLineDTO.builder()
                .id(orderLine.getId())
                .productId(orderLine.getProductId())
                .quantity(orderLine.getQuantity())
                .unitPrice(orderLine.getUnitPrice())
                .lineTotal(orderLine.getLineTotal())
                .build();
    }
}
