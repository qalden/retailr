package com.retailr.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStockReservationDTO {
    private Long id;
    private Long orderId;
    private Long productId;
    private Long warehouseId;
    private Integer reservedQuantity;
    private LocalDateTime releasedAt;
}
