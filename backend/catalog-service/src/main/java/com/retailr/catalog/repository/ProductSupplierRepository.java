package com.retailr.catalog.repository;

import com.retailr.catalog.entity.ProductSupplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductSupplierRepository extends JpaRepository<ProductSupplier, Long> {
    List<ProductSupplier> findByProduct_Id(Long productId);

    List<ProductSupplier> findBySupplier_Id(Long supplierId);
}
