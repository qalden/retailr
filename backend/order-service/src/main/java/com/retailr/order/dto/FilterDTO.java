package com.retailr.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for representing filter criteria in API requests.
 * Supports text search, numeric comparisons, and range filters.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FilterDTO {
    /**
     * The field name to filter on (e.g., "status", "orderNumber", "totalAmount")
     */
    private String field;

    /**
     * The operator to apply (e.g., "eq", "contains", "gt", "lt", "between", "in")
     */
    private String operator;

    /**
     * The filter value(s). Can be a string, number, or comma-separated list for "in" operator.
     */
    private String value;
}
