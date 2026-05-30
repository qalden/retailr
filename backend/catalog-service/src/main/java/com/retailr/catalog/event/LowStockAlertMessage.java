package com.retailr.catalog.event;

import lombok.*;
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
    private LocalDateTime timestamp;
}
