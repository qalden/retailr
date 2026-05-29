package com.retailr.catalog.repository;

import com.retailr.catalog.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySku(String sku);

    Page<Product> findByCategory_Id(Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId ORDER BY p.name ASC")
    Page<Product> findByCategoryIdOrdered(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Product> searchByNameOrSku(@Param("searchTerm") String searchTerm, Pageable pageable);
}
