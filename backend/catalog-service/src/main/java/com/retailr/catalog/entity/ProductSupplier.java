package com.retailr.catalog.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_suppliers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSupplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "supplier_sku")
    private String supplierSku;

    @Column(nullable = false)
    private Integer leadTimeDays;
}
