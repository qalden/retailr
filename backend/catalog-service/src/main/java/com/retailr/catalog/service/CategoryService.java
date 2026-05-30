package com.retailr.catalog.service;

import com.retailr.catalog.dto.CategoryDTO;
import com.retailr.catalog.dto.CreateCategoryRequest;
import com.retailr.catalog.dto.UpdateCategoryRequest;
import com.retailr.catalog.entity.Category;
import com.retailr.catalog.repository.CategoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public CategoryDTO createCategory(CreateCategoryRequest request) {
        log.info("Creating category: {}", request.getName());
        Category category = Category.builder()
            .name(request.getName())
            .description(request.getDescription() != null ? request.getDescription() : "")
            .build();

        Category saved = categoryRepository.save(category);
        log.info("Created category with ID: {}", saved.getId());
        return toDTO(saved);
    }

    public CategoryDTO getCategory(Long id) {
        log.info("Fetching category with ID: {}", id);
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        return toDTO(category);
    }

    public Page<CategoryDTO> listCategories(Pageable pageable) {
        log.info("Fetching categories with pagination - page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return categoryRepository.findAll(pageable)
            .map(this::toDTO);
    }

    public CategoryDTO updateCategory(Long id, UpdateCategoryRequest request) {
        log.info("Updating category with ID: {}", id);
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));

        if (request.getName() != null) {
            category.setName(request.getName());
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }

        Category saved = categoryRepository.save(category);
        log.info("Updated category with ID: {}", saved.getId());
        return toDTO(saved);
    }

    public void deleteCategory(Long id) {
        log.info("Deleting category with ID: {}", id);
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        categoryRepository.delete(category);
        log.info("Deleted category with ID: {}", id);
    }

    private CategoryDTO toDTO(Category category) {
        return CategoryDTO.builder()
            .id(category.getId())
            .name(category.getName())
            .description(category.getDescription())
            .createdAt(category.getCreatedAt())
            .build();
    }
}
