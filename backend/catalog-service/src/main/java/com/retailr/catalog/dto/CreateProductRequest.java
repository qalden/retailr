package com.retailr.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateProductRequest {
    @NotBlank(message = "SKU is required")
    private String sku;

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal unitPrice;

    @NotNull(message = "Low stock threshold is required")
    @Positive(message = "Low stock threshold must be positive")
    private Integer lowStockThreshold;
}
