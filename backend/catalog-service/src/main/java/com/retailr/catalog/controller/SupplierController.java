package com.retailr.catalog.controller;

import com.retailr.catalog.dto.CreateSupplierRequest;
import com.retailr.catalog.dto.SupplierDTO;
import com.retailr.catalog.dto.UpdateSupplierRequest;
import com.retailr.catalog.exception.BadPaginationException;
import com.retailr.catalog.service.SupplierService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/suppliers")
@Slf4j
public class SupplierController {
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @PostMapping("")
    public ResponseEntity<SupplierDTO> createSupplier(@Valid @RequestBody CreateSupplierRequest request) {
        log.info("Creating supplier with name: {}", request.getName());
        SupplierDTO supplier = supplierService.createSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(supplier);
    }

    @GetMapping("")
    public ResponseEntity<Page<SupplierDTO>> listSuppliers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching suppliers page: {}, size: {}", page, size);
        validatePagination(page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<SupplierDTO> suppliers = supplierService.listSuppliers(pageable);
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierDTO> getSupplier(@PathVariable Long id) {
        log.info("Fetching supplier with ID: {}", id);
        SupplierDTO supplier = supplierService.getSupplier(id);
        return ResponseEntity.ok(supplier);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierDTO> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierRequest request) {
        log.info("Updating supplier with ID: {}", id);
        SupplierDTO supplier = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(supplier);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        log.info("Deleting supplier with ID: {}", id);
        supplierService.deleteSupplier(id);
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
