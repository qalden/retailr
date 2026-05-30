package com.retailr.order.repository;

import com.retailr.order.entity.OrderStockReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderStockReservationRepository extends JpaRepository<OrderStockReservation, Long> {
    List<OrderStockReservation> findByOrderId(Long orderId);

    List<OrderStockReservation> findByWarehouseId(Long warehouseId);

    List<OrderStockReservation> findByWarehouseIdAndProductId(Long warehouseId, Long productId);
}
