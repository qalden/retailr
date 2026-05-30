package com.retailr.order.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
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

    /**
     * Reference to Product in catalog-service.
     * Not a foreign key because Product is in a separate microservice.
     */
    @Column(nullable = false)
    @NotNull(message = "Product ID is required")
    private Long productId;

    /**
     * Reference to Warehouse in catalog-service.
     * Not a foreign key because Warehouse is in a separate microservice.
     */
    @Column(nullable = false)
    @NotNull(message = "Warehouse ID is required")
    private Long warehouseId;

    @Column(nullable = false)
    @Positive(message = "Reserved quantity must be greater than 0")
    private Integer reservedQuantity;

    @Column
    private LocalDateTime releasedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
