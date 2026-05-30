package com.retailr.order.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_stock_reservations", uniqueConstraints = @UniqueConstraint(columnNames = {"order_id", "product_id", "warehouse_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStockReservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @Getter
    private Order order;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false)
    private Long warehouseId;

    @Column(nullable = false)
    @Positive(message = "Reserved quantity must be greater than 0")
    private Integer reservedQuantity;

    @Column
    private LocalDateTime releasedAt;
}
