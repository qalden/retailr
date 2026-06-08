package com.retailr.catalog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailr.catalog.dto.FilterDTO;
import com.retailr.catalog.dto.ProductDTO;
import com.retailr.catalog.service.ProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for server-side product filtering and searching.
 * Provides endpoints for searching and filtering products with support for
 * pagination and sorting.
 */
@RestController
@RequestMapping("/api/v1/products")
@Slf4j
public class ProductFilterController {
    private final ProductService productService;
    private final ObjectMapper objectMapper;

    public ProductFilterController(ProductService productService, ObjectMapper objectMapper) {
        this.productService = productService;
        this.objectMapper = objectMapper;
    }

    /**
     * Search and filter products with pagination and sorting support.
     *
     * @param search optional search term to match against product name and description
     * @param filters optional JSON array of filter criteria
     * @param sort optional sort parameter in format "field:order" (e.g., "name:asc", "price:desc")
     * @param page page number (0-indexed), defaults to 0
     * @param size page size, defaults to 20, max 100
     * @return paginated list of filtered/searched products
     */
    @GetMapping("/search")
    public ResponseEntity<Page<ProductDTO>> searchProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String filters,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("Searching products with search: {}, filters: {}, sort: {}, page: {}, size: {}",
                search, filters, sort, page, size);

        // Validate pagination parameters
        validatePagination(page, size);

        try {
            // Fetch all products (for server-side filtering)
            Pageable pageable = PageRequest.of(page, size);
            Page<ProductDTO> allProducts = productService.listProducts(pageable);
            List<ProductDTO> products = new ArrayList<>(allProducts.getContent());

            // Apply search filter
            if (search != null && !search.trim().isEmpty()) {
                String searchTerm = search.toLowerCase();
                products = products.stream()
                        .filter(p -> p.getName().toLowerCase().contains(searchTerm) ||
                                (p.getDescription() != null && p.getDescription().toLowerCase().contains(searchTerm)) ||
                                p.getSku().toLowerCase().contains(searchTerm) ||
                                p.getCategoryName().toLowerCase().contains(searchTerm))
                        .collect(Collectors.toList());
                log.debug("After search filter: {} products", products.size());
            }

            // Apply additional filters
            if (filters != null && !filters.trim().isEmpty()) {
                List<FilterDTO> filterList = parseFilters(filters);
                products = applyFilters(products, filterList);
                log.debug("After filter criteria: {} products", products.size());
            }

            // Apply sorting
            if (sort != null && !sort.trim().isEmpty()) {
                products = applySorting(products, sort);
                log.debug("After sorting: {} products", products.size());
            }

            // Create paginated response
            int totalElements = products.size();
            int fromIndex = Math.min(page * size, totalElements);
            int toIndex = Math.min(fromIndex + size, totalElements);

            List<ProductDTO> pageContent = products.subList(fromIndex, toIndex);
            Page<ProductDTO> result = new PageImpl<>(pageContent, pageable, totalElements);

            log.info("Search returned {} products (page {} of {})",
                    pageContent.size(), page, (totalElements + size - 1) / size);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error searching products", e);
            throw new IllegalArgumentException("Invalid search parameters: " + e.getMessage());
        }
    }

    /**
     * Parse filter string from JSON array format to FilterDTO list.
     * Expected format: [{"field":"name","operator":"contains","value":"test"}]
     */
    private List<FilterDTO> parseFilters(String filterJson) throws Exception {
        FilterDTO[] filters = objectMapper.readValue(filterJson, FilterDTO[].class);
        return Arrays.asList(filters);
    }

    /**
     * Apply filter criteria to the products list.
     */
    private List<ProductDTO> applyFilters(List<ProductDTO> products, List<FilterDTO> filters) {
        for (FilterDTO filter : filters) {
            products = applyFilter(products, filter);
        }
        return products;
    }

    /**
     * Apply a single filter to the products list.
     */
    private List<ProductDTO> applyFilter(List<ProductDTO> products, FilterDTO filter) {
        if (filter == null || filter.getField() == null || filter.getValue() == null) {
            return products;
        }

        String field = filter.getField().toLowerCase();
        String operator = filter.getOperator() != null ? filter.getOperator().toLowerCase() : "eq";
        String value = filter.getValue();

        return products.stream().filter(product -> {
            switch (field) {
                case "name":
                    return matchesCondition(product.getName(), value, operator);
                case "sku":
                    return matchesCondition(product.getSku(), value, operator);
                case "description":
                    return matchesCondition(product.getDescription(), value, operator);
                case "categoryname":
                case "category":
                    return matchesCondition(product.getCategoryName(), value, operator);
                case "categoryid":
                    return matchesNumericCondition(product.getCategoryId().doubleValue(), value, operator);
                case "unitprice":
                case "price":
                    return matchesNumericCondition(product.getUnitPrice().doubleValue(), value, operator);
                case "lowstockthreshold":
                    return matchesNumericCondition(product.getLowStockThreshold().doubleValue(), value, operator);
                default:
                    log.warn("Unknown filter field: {}", field);
                    return true;
            }
        }).collect(Collectors.toList());
    }

    /**
     * Check if a string value matches the given condition.
     */
    private boolean matchesCondition(String fieldValue, String filterValue, String operator) {
        if (fieldValue == null) {
            return false;
        }
        String lower = fieldValue.toLowerCase();
        String filterLower = filterValue.toLowerCase();

        switch (operator) {
            case "eq":
            case "equals":
                return lower.equals(filterLower);
            case "contains":
                return lower.contains(filterLower);
            case "startswith":
                return lower.startsWith(filterLower);
            case "endswith":
                return lower.endsWith(filterLower);
            case "in":
                String[] values = filterValue.split(",");
                return Arrays.stream(values)
                        .map(String::trim)
                        .anyMatch(v -> lower.equals(v.toLowerCase()));
            default:
                return true;
        }
    }

    /**
     * Check if a numeric value matches the given condition.
     */
    private boolean matchesNumericCondition(Double fieldValue, String filterValue, String operator) {
        if (fieldValue == null) {
            return false;
        }

        try {
            switch (operator) {
                case "eq":
                case "equals":
                    return fieldValue.equals(Double.parseDouble(filterValue));
                case "gt":
                    return fieldValue > Double.parseDouble(filterValue);
                case "gte":
                case "ge":
                    return fieldValue >= Double.parseDouble(filterValue);
                case "lt":
                    return fieldValue < Double.parseDouble(filterValue);
                case "lte":
                case "le":
                    return fieldValue <= Double.parseDouble(filterValue);
                case "between":
                    String[] range = filterValue.split(",");
                    if (range.length != 2) {
                        return true;
                    }
                    double min = Double.parseDouble(range[0].trim());
                    double max = Double.parseDouble(range[1].trim());
                    return fieldValue >= min && fieldValue <= max;
                case "in":
                    String[] values = filterValue.split(",");
                    return Arrays.stream(values)
                            .map(String::trim)
                            .map(Double::parseDouble)
                            .anyMatch(v -> v.equals(fieldValue));
                default:
                    return true;
            }
        } catch (NumberFormatException e) {
            log.warn("Invalid numeric filter value: {}", filterValue, e);
            return true;
        }
    }

    /**
     * Apply sorting to the products list.
     * Format: "field:order" where order is "asc" or "desc"
     */
    private List<ProductDTO> applySorting(List<ProductDTO> products, String sort) {
        String[] parts = sort.split(":");
        if (parts.length != 2) {
            log.warn("Invalid sort format: {}", sort);
            return products;
        }

        String field = parts[0].toLowerCase();
        String order = parts[1].toLowerCase();

        return products.stream()
                .sorted((a, b) -> {
                    Comparable<?> aValue = null;
                    Comparable<?> bValue = null;

                    switch (field) {
                        case "name":
                            aValue = a.getName();
                            bValue = b.getName();
                            break;
                        case "sku":
                            aValue = a.getSku();
                            bValue = b.getSku();
                            break;
                        case "unitprice":
                        case "price":
                            aValue = a.getUnitPrice();
                            bValue = b.getUnitPrice();
                            break;
                        case "lowstockthreshold":
                            aValue = a.getLowStockThreshold();
                            bValue = b.getLowStockThreshold();
                            break;
                        case "createdat":
                            aValue = a.getCreatedAt();
                            bValue = b.getCreatedAt();
                            break;
                        default:
                            log.warn("Unknown sort field: {}", field);
                            return 0;
                    }

                    if (aValue == null || bValue == null) {
                        return 0;
                    }

                    int comparison = ((Comparable) aValue).compareTo(bValue);
                    return "desc".equals(order) ? -comparison : comparison;
                })
                .collect(Collectors.toList());
    }

    /**
     * Validate pagination parameters.
     */
    private void validatePagination(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Page number cannot be negative");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("Page size must be greater than 0");
        }
        if (size > PaginationConstants.MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("Page size cannot exceed " + PaginationConstants.MAX_PAGE_SIZE);
        }
    }
}
