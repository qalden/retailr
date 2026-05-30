package com.retailr.catalog.controller;

import com.retailr.catalog.dto.CategoryDTO;
import com.retailr.catalog.dto.CreateCategoryRequest;
import com.retailr.catalog.dto.UpdateCategoryRequest;
import com.retailr.catalog.exception.BadPaginationException;
import com.retailr.catalog.service.CategoryService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/categories")
@Slf4j
public class CategoryController {
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping("")
    public ResponseEntity<CategoryDTO> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        log.info("Creating category with name: {}", request.getName());
        CategoryDTO category = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategory(@PathVariable Long id) {
        log.info("Fetching category with ID: {}", id);
        CategoryDTO category = categoryService.getCategory(id);
        return ResponseEntity.ok(category);
    }

    @GetMapping("")
    public ResponseEntity<Page<CategoryDTO>> listCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching categories page: {}, size: {}", page, size);
        validatePagination(page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<CategoryDTO> categories = categoryService.listCategories(pageable);
        return ResponseEntity.ok(categories);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        log.info("Updating category with ID: {}", id);
        CategoryDTO category = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(category);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        log.info("Deleting category with ID: {}", id);
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    private void validatePagination(int page, int size) {
        if (page < 0) {
            throw new BadPaginationException("Page number cannot be negative");
        }
        if (size <= 0) {
            throw new BadPaginationException("Page size must be greater than 0");
        }
        if (size > MAX_PAGE_SIZE) {
            throw new BadPaginationException("Page size cannot exceed " + MAX_PAGE_SIZE);
        }
    }
}
