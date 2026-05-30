package com.retailr.catalog.event;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockUpdateEvent {
    private Long productId;
    private Long warehouseId;
    private Integer previousQuantity;
    private Integer newQuantity;
    private MovementType movementType;
    private LocalDateTime timestamp;

    public enum MovementType {
        ADJUSTMENT, ORDER_CONFIRMATION, RETURN
    }
}
