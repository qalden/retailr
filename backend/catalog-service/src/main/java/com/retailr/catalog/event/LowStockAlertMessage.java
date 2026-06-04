package com.retailr.catalog.event;

import lombok.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LowStockAlertMessage {
    private Long productId;
    private String productName;
    private Long warehouseId;
    private Integer threshold;

    @NotNull(message = "Timestamp is required")
    private LocalDateTime timestamp;
}
