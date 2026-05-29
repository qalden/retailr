package com.retailr.catalog.service;

import com.retailr.catalog.dto.CreateStockMovementRequest;
import com.retailr.catalog.dto.StockItemDTO;
import com.retailr.catalog.dto.StockMovementDTO;
import com.retailr.catalog.dto.LowStockAlertDTO;
import com.retailr.catalog.entity.StockItem;
import com.retailr.catalog.entity.StockMovement;
import com.retailr.catalog.entity.LowStockAlert;
import com.retailr.catalog.exception.StockException;
import com.retailr.catalog.repository.StockItemRepository;
import com.retailr.catalog.repository.StockMovementRepository;
import com.retailr.catalog.repository.LowStockAlertRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StockService {
    private final StockItemRepository stockItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final LowStockAlertRepository lowStockAlertRepository;

    public StockService(StockItemRepository stockItemRepository,
                        StockMovementRepository stockMovementRepository,
                        LowStockAlertRepository lowStockAlertRepository) {
        this.stockItemRepository = stockItemRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.lowStockAlertRepository = lowStockAlertRepository;
    }

    public StockItemDTO getStockItem(Long id) {
        StockItem item = stockItemRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("StockItem not found: " + id));
        return toDTO(item);
    }

    public List<StockItemDTO> getStockByProduct(Long productId) {
        return stockItemRepository.findByProduct_Id(productId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<StockItemDTO> getStockByWarehouse(Long warehouseId) {
        return stockItemRepository.findByWarehouse_Id(warehouseId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public StockItemDTO getStockItemByProductAndWarehouse(Long productId, Long warehouseId) {
        StockItem item = stockItemRepository.findByProductIdAndWarehouseId(productId, warehouseId)
            .orElseThrow(() -> new IllegalArgumentException("StockItem not found for product: " + productId + ", warehouse: " + warehouseId));
        return toDTO(item);
    }

    public StockMovementDTO recordMovement(CreateStockMovementRequest request) {
        StockItem item = stockItemRepository.findById(request.getStockItemId())
            .orElseThrow(() -> new IllegalArgumentException("StockItem not found: " + request.getStockItemId()));

        StockMovement movement = StockMovement.builder()
            .stockItem(item)
            .quantityDelta(request.getQuantityDelta())
            .movementType(request.getMovementType())
            .referenceType(request.getReferenceType())
            .referenceId(request.getReferenceId())
            .build();

        StockMovement saved = stockMovementRepository.save(movement);
        return toMovementDTO(saved);
    }

    public List<StockMovementDTO> getMovementsForStockItem(Long stockItemId) {
        return stockMovementRepository.findByStockItem_IdOrderByCreatedAtDesc(stockItemId).stream()
            .map(this::toMovementDTO)
            .collect(Collectors.toList());
    }

    public List<LowStockAlertDTO> getUnacknowledgedAlerts() {
        return lowStockAlertRepository.findUnacknowledgedAlerts().stream()
            .map(this::toAlertDTO)
            .collect(Collectors.toList());
    }

    public List<LowStockAlertDTO> getAlertsForStockItem(Long stockItemId) {
        return lowStockAlertRepository.findByStockItem_Id(stockItemId).stream()
            .map(this::toAlertDTO)
            .collect(Collectors.toList());
    }

    public void reserveStock(Long stockItemId, Integer quantity) {
        StockItem item = stockItemRepository.findById(stockItemId)
            .orElseThrow(() -> new IllegalArgumentException("StockItem not found: " + stockItemId));

        Integer available = item.getAvailableQuantity();
        if (available < quantity) {
            throw new StockException("Insufficient stock available. Available: " + available + ", Requested: " + quantity);
        }

        item.setReservedQuantity(item.getReservedQuantity() + quantity);
        stockItemRepository.save(item);
    }

    public void releaseStock(Long stockItemId, Integer quantity) {
        StockItem item = stockItemRepository.findById(stockItemId)
            .orElseThrow(() -> new IllegalArgumentException("StockItem not found: " + stockItemId));

        Integer currentReserved = item.getReservedQuantity();
        if (currentReserved < quantity) {
            throw new StockException("Cannot release more than reserved. Reserved: " + currentReserved + ", Requested: " + quantity);
        }

        item.setReservedQuantity(currentReserved - quantity);
        stockItemRepository.save(item);
    }

    private StockItemDTO toDTO(StockItem item) {
        return StockItemDTO.builder()
            .id(item.getId())
            .productId(item.getProduct().getId())
            .warehouseId(item.getWarehouse().getId())
            .quantity(item.getQuantity())
            .reservedQuantity(item.getReservedQuantity())
            .availableQuantity(item.getAvailableQuantity())
            .updatedAt(item.getUpdatedAt())
            .build();
    }

    private StockMovementDTO toMovementDTO(StockMovement movement) {
        return StockMovementDTO.builder()
            .id(movement.getId())
            .stockItemId(movement.getStockItem().getId())
            .quantityDelta(movement.getQuantityDelta())
            .movementType(movement.getMovementType())
            .referenceType(movement.getReferenceType())
            .referenceId(movement.getReferenceId())
            .createdByUserId(movement.getCreatedBy() != null ? movement.getCreatedBy().getId() : null)
            .createdAt(movement.getCreatedAt())
            .build();
    }

    private LowStockAlertDTO toAlertDTO(LowStockAlert alert) {
        return LowStockAlertDTO.builder()
            .id(alert.getId())
            .stockItemId(alert.getStockItem().getId())
            .triggeredAt(alert.getTriggeredAt())
            .acknowledgedAt(alert.getAcknowledgedAt())
            .acknowledgedByUserId(alert.getAcknowledgedBy() != null ? alert.getAcknowledgedBy().getId() : null)
            .build();
    }
}
