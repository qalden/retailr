package com.retailr.catalog.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

@Entity
@Table(name = "low_stock_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LowStockAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_item_id", nullable = false)
    private StockItem stockItem;

    @Column(nullable = false, updatable = false)
    private LocalDateTime triggeredAt;

    @Column
    private LocalDateTime acknowledgedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "acknowledged_by")
    @NotFound(action = NotFoundAction.IGNORE)
    private User acknowledgedBy;

    @PrePersist
    protected void onCreate() {
        triggeredAt = LocalDateTime.now();
    }
}
