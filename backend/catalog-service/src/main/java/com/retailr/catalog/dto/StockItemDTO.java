package com.retailr.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockItemDTO {
    private Long id;
    private Long productId;
    private Long warehouseId;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private java.time.LocalDateTime updatedAt;
}
