package com.retailr.catalog.dto;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProductRequest {
    private String name;

    private String description;

    private Long categoryId;

    @Positive(message = "Price must be positive if provided")
    private BigDecimal unitPrice;

    @Positive(message = "Low stock threshold must be positive if provided")
    private Integer lowStockThreshold;
}
