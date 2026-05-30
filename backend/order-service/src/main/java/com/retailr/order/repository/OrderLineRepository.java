package com.retailr.order.repository;

import com.retailr.order.entity.OrderLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderLineRepository extends JpaRepository<OrderLine, Long> {
    List<OrderLine> findByOrderId(Long orderId);
}
