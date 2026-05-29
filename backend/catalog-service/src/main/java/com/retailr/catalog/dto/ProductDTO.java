package com.retailr.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDTO {
    private Long id;
    private String sku;
    private String name;
    private String description;
    private Long categoryId;
    private String categoryName;
    private java.math.BigDecimal unitPrice;
    private Integer lowStockThreshold;
    private List<Long> supplierIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
