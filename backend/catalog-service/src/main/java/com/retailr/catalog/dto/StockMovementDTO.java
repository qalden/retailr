package com.retailr.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovementDTO {
    private Long id;
    private Long stockItemId;
    private Integer quantityDelta;
    private String movementType;
    private String referenceType;
    private Long referenceId;
    private Long createdByUserId;
    private java.time.LocalDateTime createdAt;
}
