package com.retailr.catalog.repository;

import com.retailr.catalog.entity.LowStockAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LowStockAlertRepository extends JpaRepository<LowStockAlert, Long> {
    List<LowStockAlert> findByStockItem_Id(Long stockItemId);

    @Query("SELECT lsa FROM LowStockAlert lsa WHERE lsa.acknowledgedAt IS NULL")
    List<LowStockAlert> findUnacknowledgedAlerts();
}
