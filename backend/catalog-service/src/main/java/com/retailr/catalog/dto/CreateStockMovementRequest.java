package com.retailr.catalog.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateStockMovementRequest {
    @NotNull(message = "stockItemId is required")
    private Long stockItemId;

    @NotNull(message = "quantityDelta is required")
    private Integer quantityDelta;

    @NotNull(message = "movementType is required")
    private String movementType;

    private String referenceType;
    private Long referenceId;
}
