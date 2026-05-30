package com.retailr.catalog.service;

import com.retailr.catalog.dto.CategoryDTO;
import com.retailr.catalog.dto.CreateProductRequest;
import com.retailr.catalog.dto.ProductDTO;
import com.retailr.catalog.dto.UpdateProductRequest;
import com.retailr.catalog.entity.Category;
import com.retailr.catalog.entity.Product;
import com.retailr.catalog.entity.ProductSupplier;
import com.retailr.catalog.repository.CategoryRepository;
import com.retailr.catalog.repository.ProductRepository;
import com.retailr.catalog.repository.ProductSupplierRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductSupplierRepository productSupplierRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          ProductSupplierRepository productSupplierRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productSupplierRepository = productSupplierRepository;
    }

    public ProductDTO createProduct(CreateProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.getCategoryId()));

        Product product = Product.builder()
            .sku(request.getSku())
            .name(request.getName())
            .description(request.getDescription())
            .category(category)
            .unitPrice(request.getUnitPrice())
            .lowStockThreshold(request.getLowStockThreshold())
            .build();

        Product saved = productRepository.save(product);
        return toDTO(saved);
    }

    public ProductDTO getProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
        return toDTO(product);
    }

    public Page<ProductDTO> listProducts(Pageable pageable) {
        return productRepository.findAll(pageable)
            .map(this::toDTO);
    }

    public Page<ProductDTO> listActiveProducts(Pageable pageable) {
        return productRepository.findAll(pageable)
            .map(this::toDTO);
    }

    public Page<ProductDTO> listProductsByCategory(Long categoryId, Pageable pageable) {
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));
        return productRepository.findByCategory_Id(categoryId, pageable)
            .map(this::toDTO);
    }

    public ProductDTO updateProduct(Long id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));

        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.getCategoryId()));
            product.setCategory(category);
        }
        if (request.getUnitPrice() != null) {
            product.setUnitPrice(request.getUnitPrice());
        }
        if (request.getLowStockThreshold() != null) {
            product.setLowStockThreshold(request.getLowStockThreshold());
        }

        Product saved = productRepository.save(product);
        return toDTO(saved);
    }

    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
        productRepository.delete(product);
    }

    public List<ProductDTO> getProductsBySupplier(Long supplierId) {
        List<ProductSupplier> productSuppliers = productSupplierRepository.findBySupplier_Id(supplierId);
        return productSuppliers.stream()
            .map(ps -> toDTO(ps.getProduct()))
            .collect(Collectors.toList());
    }

    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
            .map(this::toCategoryDTO)
            .collect(Collectors.toList());
    }

    public CategoryDTO getCategory(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        return toCategoryDTO(category);
    }

    private ProductDTO toDTO(Product product) {
        List<Long> supplierIds = product.getSuppliers().stream()
            .map(ps -> ps.getSupplier().getId())
            .collect(Collectors.toList());

        return ProductDTO.builder()
            .id(product.getId())
            .sku(product.getSku())
            .name(product.getName())
            .description(product.getDescription())
            .categoryId(product.getCategory().getId())
            .categoryName(product.getCategory().getName())
            .unitPrice(product.getUnitPrice())
            .lowStockThreshold(product.getLowStockThreshold())
            .supplierIds(supplierIds)
            .createdAt(product.getCreatedAt())
            .updatedAt(product.getUpdatedAt())
            .build();
    }

    private CategoryDTO toCategoryDTO(Category category) {
        return CategoryDTO.builder()
            .id(category.getId())
            .name(category.getName())
            .description(category.getDescription())
            .createdAt(category.getCreatedAt())
            .build();
    }
}
