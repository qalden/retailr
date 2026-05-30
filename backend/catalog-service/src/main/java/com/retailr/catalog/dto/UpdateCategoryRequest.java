package com.retailr.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCategoryRequest {
    // Name is optional for partial updates - validation is relaxed to allow omitting name in PATCH-like requests
    // Service layer will validate non-null values if needed
    private String name;

    private String description;
}
