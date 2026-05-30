package com.retailr.order.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_lines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderLine {
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
    @Positive(message = "Quantity must be greater than 0")
    private Integer quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    @DecimalMin(value = "0.00", message = "Unit price must be non-negative")
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    @DecimalMin(value = "0.00", message = "Line total must be non-negative")
    private BigDecimal lineTotal;
}
