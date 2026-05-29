package com.retailr.catalog.repository;

import com.retailr.catalog.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByStockItem_IdOrderByCreatedAtDesc(Long stockItemId);

    List<StockMovement> findByMovementType(String movementType);
}
