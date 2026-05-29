package com.retailr.catalog.repository;

import com.retailr.catalog.entity.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockItemRepository extends JpaRepository<StockItem, Long> {
    List<StockItem> findByProduct_Id(Long productId);

    List<StockItem> findByWarehouse_Id(Long warehouseId);

    Optional<StockItem> findByProductIdAndWarehouseId(Long productId, Long warehouseId);
}
