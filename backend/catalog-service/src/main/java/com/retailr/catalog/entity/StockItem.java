package com.retailr.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "stock_items", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"product_id", "warehouse_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    @NotNull
    @Builder.Default
    private Integer quantity = 0;

    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    @NotNull
    @Builder.Default
    private Integer reservedQuantity = 0;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Integer getAvailableQuantity() {
        return quantity - reservedQuantity;
    }
}
