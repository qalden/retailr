package com.retailr.catalog.event;

import lombok.*;
import jakarta.validation.constraints.NotNull;
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
    private String sku;
    private String warehouse;
    private Integer reservedQuantity;
    private Boolean alert;

    @NotNull(message = "Timestamp is required")
    private LocalDateTime timestamp;

    public enum MovementType {
        ADJUSTMENT, ORDER_CONFIRMATION, RETURN
    }
}
