package com.retailr.catalog.controller;

import com.retailr.catalog.dto.CreateStockMovementRequest;
import com.retailr.catalog.dto.StockItemDTO;
import com.retailr.catalog.dto.StockMovementDTO;
import com.retailr.catalog.dto.LowStockAlertDTO;
import com.retailr.catalog.service.StockService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stock")
@Slf4j
public class StockController {
    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockItemDTO> getStockItem(@PathVariable Long id) {
        log.info("Getting stock item: {}", id);
        StockItemDTO item = stockService.getStockItem(id);
        return ResponseEntity.ok(item);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<StockItemDTO>> getStockByProduct(@PathVariable Long productId) {
        log.info("Getting stock for product: {}", productId);
        List<StockItemDTO> items = stockService.getStockByProduct(productId);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<StockItemDTO>> getStockByWarehouse(@PathVariable Long warehouseId) {
        log.info("Getting stock for warehouse: {}", warehouseId);
        List<StockItemDTO> items = stockService.getStockByWarehouse(warehouseId);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/product/{productId}/warehouse/{warehouseId}")
    public ResponseEntity<StockItemDTO> getStockItemByProductAndWarehouse(
            @PathVariable Long productId,
            @PathVariable Long warehouseId) {
        log.info("Getting stock for product: {}, warehouse: {}", productId, warehouseId);
        StockItemDTO item = stockService.getStockItemByProductAndWarehouse(productId, warehouseId);
        return ResponseEntity.ok(item);
    }

    @PostMapping("/movement")
    public ResponseEntity<StockMovementDTO> recordMovement(@Valid @RequestBody CreateStockMovementRequest request) {
        log.info("Recording stock movement: {}", request.getMovementType());
        StockMovementDTO movement = stockService.recordMovement(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(movement);
    }

    @GetMapping("/{stockItemId}/movements")
    public ResponseEntity<List<StockMovementDTO>> getMovementsForStockItem(@PathVariable Long stockItemId) {
        log.info("Getting movements for stock item: {}", stockItemId);
        List<StockMovementDTO> movements = stockService.getMovementsForStockItem(stockItemId);
        return ResponseEntity.ok(movements);
    }

    @PostMapping("/{stockItemId}/reserve")
    public ResponseEntity<Void> reserveStock(
            @PathVariable Long stockItemId,
            @RequestParam Integer quantity) {
        log.info("Reserving stock: item={}, quantity={}", stockItemId, quantity);
        stockService.reserveStock(stockItemId, quantity);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{stockItemId}/release")
    public ResponseEntity<Void> releaseStock(
            @PathVariable Long stockItemId,
            @RequestParam Integer quantity) {
        log.info("Releasing stock: item={}, quantity={}", stockItemId, quantity);
        stockService.releaseStock(stockItemId, quantity);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<LowStockAlertDTO>> getUnacknowledgedAlerts() {
        log.info("Getting unacknowledged low stock alerts");
        List<LowStockAlertDTO> alerts = stockService.getUnacknowledgedAlerts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/{stockItemId}/alerts")
    public ResponseEntity<List<LowStockAlertDTO>> getAlertsForStockItem(@PathVariable Long stockItemId) {
        log.info("Getting alerts for stock item: {}", stockItemId);
        List<LowStockAlertDTO> alerts = stockService.getAlertsForStockItem(stockItemId);
        return ResponseEntity.ok(alerts);
    }
}
