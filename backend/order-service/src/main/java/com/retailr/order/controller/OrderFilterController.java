package com.retailr.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailr.order.dto.FilterDTO;
import com.retailr.order.dto.OrderDTO;
import com.retailr.order.entity.OrderStatus;
import com.retailr.order.service.OrderService;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for server-side order filtering and searching.
 * Provides endpoints for searching and filtering orders with support for
 * pagination and sorting.
 */
@RestController
@RequestMapping("/api/v1/orders")
@Slf4j
public class OrderFilterController {
    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    public OrderFilterController(OrderService orderService, ObjectMapper objectMapper) {
        this.orderService = orderService;
        this.objectMapper = objectMapper;
    }

    /**
     * Search and filter orders with pagination and sorting support.
     *
     * @param search optional search term to match against order number or customer name
     * @param filters optional JSON array of filter criteria
     * @param sort optional sort parameter in format "field:order" (e.g., "createdAt:desc", "totalAmount:asc")
     * @param page page number (0-indexed), defaults to 0
     * @param size page size, defaults to 20, max 100
     * @return paginated list of filtered/searched orders
     */
    @GetMapping("/search")
    public ResponseEntity<Page<OrderDTO>> searchOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String filters,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("Searching orders with search: {}, filters: {}, sort: {}, page: {}, size: {}",
                search, filters, sort, page, size);

        // Validate pagination parameters
        validatePagination(page, size);

        try {
            // Note: In a production system, this would use database queries for better performance.
            // For now, we fetch all orders and filter in memory.
            // A more scalable implementation would push filtering to the database layer.

            Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE); // Fetch all for filtering
            Page<OrderDTO> allOrders = orderService.listAllOrders(pageable);
            List<OrderDTO> orders = new ArrayList<>(allOrders.getContent());

            // Apply search filter
            if (search != null && !search.trim().isEmpty()) {
                String searchTerm = search.toLowerCase();
                orders = orders.stream()
                        .filter(o -> o.getOrderNumber().toLowerCase().contains(searchTerm) ||
                                (o.getCustomer() != null && o.getCustomer().getName() != null &&
                                        o.getCustomer().getName().toLowerCase().contains(searchTerm)))
                        .collect(Collectors.toList());
                log.debug("After search filter: {} orders", orders.size());
            }

            // Apply additional filters
            if (filters != null && !filters.trim().isEmpty()) {
                List<FilterDTO> filterList = parseFilters(filters);
                orders = applyFilters(orders, filterList);
                log.debug("After filter criteria: {} orders", orders.size());
            }

            // Apply sorting
            if (sort != null && !sort.trim().isEmpty()) {
                orders = applySorting(orders, sort);
                log.debug("After sorting: {} orders", orders.size());
            }

            // Create paginated response
            int totalElements = orders.size();
            int fromIndex = Math.min(page * size, totalElements);
            int toIndex = Math.min(fromIndex + size, totalElements);

            List<OrderDTO> pageContent = orders.subList(fromIndex, toIndex);
            Pageable responsePageable = PageRequest.of(page, size);
            Page<OrderDTO> result = new PageImpl<>(pageContent, responsePageable, totalElements);

            log.info("Search returned {} orders (page {} of {})",
                    pageContent.size(), page, (totalElements + size - 1) / size);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error searching orders", e);
            throw new IllegalArgumentException("Invalid search parameters: " + e.getMessage());
        }
    }

    /**
     * Parse filter string from JSON array format to FilterDTO list.
     * Expected format: [{"field":"status","operator":"eq","value":"PENDING"}]
     */
    private List<FilterDTO> parseFilters(String filterJson) throws Exception {
        FilterDTO[] filters = objectMapper.readValue(filterJson, FilterDTO[].class);
        return Arrays.asList(filters);
    }

    /**
     * Apply filter criteria to the orders list.
     */
    private List<OrderDTO> applyFilters(List<OrderDTO> orders, List<FilterDTO> filters) {
        for (FilterDTO filter : filters) {
            orders = applyFilter(orders, filter);
        }
        return orders;
    }

    /**
     * Apply a single filter to the orders list.
     */
    private List<OrderDTO> applyFilter(List<OrderDTO> orders, FilterDTO filter) {
        if (filter == null || filter.getField() == null || filter.getValue() == null) {
            return orders;
        }

        String field = filter.getField().toLowerCase();
        String operator = filter.getOperator() != null ? filter.getOperator().toLowerCase() : "eq";
        String value = filter.getValue();

        return orders.stream().filter(order -> {
            switch (field) {
                case "ordernumber":
                    return matchesCondition(order.getOrderNumber(), value, operator);
                case "status":
                    return matchesOrderStatus(order.getStatus(), value, operator);
                case "customername":
                case "customer":
                    String customerName = order.getCustomer() != null ? order.getCustomer().getName() : null;
                    return matchesCondition(customerName, value, operator);
                case "totalamount":
                case "amount":
                    return matchesNumericCondition(order.getTotalAmount().doubleValue(), value, operator);
                case "createdat":
                    return matchesDateCondition(order.getCreatedAt(), value, operator);
                case "confirmedat":
                    return matchesDateCondition(order.getConfirmedAt(), value, operator);
                case "fulfillat":
                case "fulfilledat":
                    return matchesDateCondition(order.getFulfilledAt(), value, operator);
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
     * Check if an OrderStatus matches the given condition.
     */
    private boolean matchesOrderStatus(OrderStatus fieldValue, String filterValue, String operator) {
        if (fieldValue == null) {
            return false;
        }

        switch (operator) {
            case "eq":
            case "equals":
                try {
                    return fieldValue == OrderStatus.valueOf(filterValue.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid order status: {}", filterValue);
                    return false;
                }
            case "in":
                String[] statuses = filterValue.split(",");
                return Arrays.stream(statuses)
                        .map(String::trim)
                        .anyMatch(s -> {
                            try {
                                return fieldValue == OrderStatus.valueOf(s.toUpperCase());
                            } catch (IllegalArgumentException e) {
                                return false;
                            }
                        });
            case "ne":
            case "notequals":
                try {
                    return fieldValue != OrderStatus.valueOf(filterValue.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return true;
                }
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
                default:
                    return true;
            }
        } catch (NumberFormatException e) {
            log.warn("Invalid numeric filter value: {}", filterValue, e);
            return true;
        }
    }

    /**
     * Check if a date value matches the given condition.
     */
    private boolean matchesDateCondition(LocalDateTime fieldValue, String filterValue, String operator) {
        if (fieldValue == null) {
            return false;
        }

        try {
            switch (operator) {
                case "eq":
                case "equals":
                    LocalDateTime filterDate = LocalDateTime.parse(filterValue);
                    return fieldValue.toLocalDate().equals(filterDate.toLocalDate());
                case "gt":
                    return fieldValue.isAfter(LocalDateTime.parse(filterValue));
                case "gte":
                case "ge":
                    return fieldValue.isAfter(LocalDateTime.parse(filterValue)) ||
                            fieldValue.toLocalDate().equals(LocalDateTime.parse(filterValue).toLocalDate());
                case "lt":
                    return fieldValue.isBefore(LocalDateTime.parse(filterValue));
                case "lte":
                case "le":
                    return fieldValue.isBefore(LocalDateTime.parse(filterValue)) ||
                            fieldValue.toLocalDate().equals(LocalDateTime.parse(filterValue).toLocalDate());
                case "between":
                    String[] range = filterValue.split(",");
                    if (range.length != 2) {
                        return true;
                    }
                    LocalDateTime startDate = LocalDateTime.parse(range[0].trim());
                    LocalDateTime endDate = LocalDateTime.parse(range[1].trim());
                    return (fieldValue.isAfter(startDate) || fieldValue.toLocalDate().equals(startDate.toLocalDate())) &&
                            (fieldValue.isBefore(endDate) || fieldValue.toLocalDate().equals(endDate.toLocalDate()));
                default:
                    return true;
            }
        } catch (Exception e) {
            log.warn("Invalid date filter value: {}", filterValue, e);
            return true;
        }
    }

    /**
     * Apply sorting to the orders list.
     * Format: "field:order" where order is "asc" or "desc"
     */
    private List<OrderDTO> applySorting(List<OrderDTO> orders, String sort) {
        String[] parts = sort.split(":");
        if (parts.length != 2) {
            log.warn("Invalid sort format: {}", sort);
            return orders;
        }

        String field = parts[0].toLowerCase();
        String order = parts[1].toLowerCase();

        return orders.stream()
                .sorted((a, b) -> {
                    Comparable<?> aValue = null;
                    Comparable<?> bValue = null;

                    switch (field) {
                        case "ordernumber":
                            aValue = a.getOrderNumber();
                            bValue = b.getOrderNumber();
                            break;
                        case "status":
                            aValue = a.getStatus() != null ? a.getStatus().toString() : null;
                            bValue = b.getStatus() != null ? b.getStatus().toString() : null;
                            break;
                        case "totalamount":
                        case "amount":
                            aValue = a.getTotalAmount();
                            bValue = b.getTotalAmount();
                            break;
                        case "createdat":
                            aValue = a.getCreatedAt();
                            bValue = b.getCreatedAt();
                            break;
                        case "confirmedat":
                            aValue = a.getConfirmedAt();
                            bValue = b.getConfirmedAt();
                            break;
                        case "fulfilledat":
                            aValue = a.getFulfilledAt();
                            bValue = b.getFulfilledAt();
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
