package com.retailr.catalog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailr.catalog.dto.CategoryDTO;
import com.retailr.catalog.dto.CreateCategoryRequest;
import com.retailr.catalog.dto.UpdateCategoryRequest;
import com.retailr.catalog.exception.GlobalExceptionHandler;
import com.retailr.catalog.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CategoryControllerTest {
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private StubCategoryService stubCategoryService;

    @BeforeEach
    void setUp() {
        stubCategoryService = new StubCategoryService();
        CategoryController controller = new CategoryController(stubCategoryService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testCreateCategory_Success() throws Exception {
        CreateCategoryRequest request = CreateCategoryRequest.builder()
            .name("Electronics")
            .description("Electronic devices and accessories")
            .build();

        CategoryDTO responseDto = CategoryDTO.builder()
            .id(1L)
            .name("Electronics")
            .description("Electronic devices and accessories")
            .createdAt(LocalDateTime.now())
            .build();

        stubCategoryService.setupCreateCategory(responseDto);

        mockMvc.perform(post("/api/v1/categories")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Electronics"))
            .andExpect(jsonPath("$.description").value("Electronic devices and accessories"));
    }

    @Test
    void testCreateCategory_ValidationError_BlankName() throws Exception {
        CreateCategoryRequest request = CreateCategoryRequest.builder()
            .name("") // Invalid: blank
            .description("Electronic devices")
            .build();

        mockMvc.perform(post("/api/v1/categories")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void testCreateCategory_ValidationError_NullName() throws Exception {
        CreateCategoryRequest request = CreateCategoryRequest.builder()
            .description("Electronic devices")
            .build();

        mockMvc.perform(post("/api/v1/categories")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void testGetCategory_Success() throws Exception {
        CategoryDTO responseDto = CategoryDTO.builder()
            .id(1L)
            .name("Electronics")
            .description("Electronic devices and accessories")
            .createdAt(LocalDateTime.now())
            .build();

        stubCategoryService.setupGetCategory(1L, responseDto);

        mockMvc.perform(get("/api/v1/categories/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Electronics"))
            .andExpect(jsonPath("$.description").value("Electronic devices and accessories"));
    }

    @Test
    void testGetCategory_NotFound() throws Exception {
        stubCategoryService.setupThrowException(new IllegalArgumentException("Category not found: 999"));

        mockMvc.perform(get("/api/v1/categories/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Category not found: 999"));
    }

    @Test
    void testListCategories_Success() throws Exception {
        List<CategoryDTO> categories = Arrays.asList(
            CategoryDTO.builder()
                .id(1L)
                .name("Electronics")
                .description("Electronic devices and accessories")
                .createdAt(LocalDateTime.now())
                .build(),
            CategoryDTO.builder()
                .id(2L)
                .name("Clothing")
                .description("Apparel and fashion items")
                .createdAt(LocalDateTime.now())
                .build()
        );

        stubCategoryService.setupListCategories(categories);

        mockMvc.perform(get("/api/v1/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].name").value("Electronics"))
            .andExpect(jsonPath("$[1].id").value(2))
            .andExpect(jsonPath("$[1].name").value("Clothing"));
    }

    @Test
    void testListCategories_EmptyList() throws Exception {
        List<CategoryDTO> categories = new ArrayList<>();
        stubCategoryService.setupListCategories(categories);

        mockMvc.perform(get("/api/v1/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void testUpdateCategory_Success() throws Exception {
        UpdateCategoryRequest request = UpdateCategoryRequest.builder()
            .name("Electronics & Gadgets")
            .description("All electronic devices and accessories")
            .build();

        CategoryDTO responseDto = CategoryDTO.builder()
            .id(1L)
            .name("Electronics & Gadgets")
            .description("All electronic devices and accessories")
            .createdAt(LocalDateTime.now())
            .build();

        stubCategoryService.setupUpdateCategory(responseDto);

        mockMvc.perform(put("/api/v1/categories/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Electronics & Gadgets"))
            .andExpect(jsonPath("$.description").value("All electronic devices and accessories"));
    }

    @Test
    void testUpdateCategory_NotFound() throws Exception {
        UpdateCategoryRequest request = UpdateCategoryRequest.builder()
            .name("Updated Category")
            .build();

        stubCategoryService.setupThrowException(new IllegalArgumentException("Category not found: 999"));

        mockMvc.perform(put("/api/v1/categories/999")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Category not found: 999"));
    }

    @Test
    void testUpdateCategory_ValidationError_BlankName() throws Exception {
        UpdateCategoryRequest request = UpdateCategoryRequest.builder()
            .name("") // Invalid: blank when provided
            .build();

        mockMvc.perform(put("/api/v1/categories/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void testUpdateCategory_PartialUpdate() throws Exception {
        UpdateCategoryRequest request = UpdateCategoryRequest.builder()
            .name("New Name")
            .build();

        CategoryDTO responseDto = CategoryDTO.builder()
            .id(1L)
            .name("New Name")
            .description("Original description")
            .createdAt(LocalDateTime.now())
            .build();

        stubCategoryService.setupUpdateCategory(responseDto);

        mockMvc.perform(put("/api/v1/categories/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("New Name"))
            .andExpect(jsonPath("$.description").value("Original description"));
    }

    @Test
    void testDeleteCategory_Success() throws Exception {
        stubCategoryService.setupDeleteSuccess();

        mockMvc.perform(delete("/api/v1/categories/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    void testDeleteCategory_NotFound() throws Exception {
        stubCategoryService.setupThrowException(new IllegalArgumentException("Category not found: 999"));

        mockMvc.perform(delete("/api/v1/categories/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Category not found: 999"));
    }

    /**
     * Test stub for CategoryService - works around Java mocking limitations
     */
    static class StubCategoryService extends CategoryService {
        private CategoryDTO categoryResponse;
        private List<CategoryDTO> listResponse;
        private RuntimeException exceptionToThrow;

        public StubCategoryService() {
            super(null);
        }

        void setupCreateCategory(CategoryDTO dto) {
            this.categoryResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupGetCategory(Long id, CategoryDTO dto) {
            this.categoryResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupListCategories(List<CategoryDTO> categories) {
            this.listResponse = categories;
            this.exceptionToThrow = null;
        }

        void setupUpdateCategory(CategoryDTO dto) {
            this.categoryResponse = dto;
            this.exceptionToThrow = null;
        }

        void setupDeleteSuccess() {
            this.exceptionToThrow = null;
        }

        void setupThrowException(RuntimeException ex) {
            this.exceptionToThrow = ex;
        }

        @Override
        public CategoryDTO createCategory(CreateCategoryRequest request) {
            throwIfNeeded();
            return categoryResponse;
        }

        @Override
        public CategoryDTO getCategory(Long id) {
            throwIfNeeded();
            return categoryResponse;
        }

        @Override
        public List<CategoryDTO> listCategories() {
            throwIfNeeded();
            return listResponse != null ? listResponse : new ArrayList<>();
        }

        @Override
        public CategoryDTO updateCategory(Long id, UpdateCategoryRequest request) {
            throwIfNeeded();
            return categoryResponse;
        }

        @Override
        public void deleteCategory(Long id) {
            throwIfNeeded();
        }

        private void throwIfNeeded() {
            if (exceptionToThrow != null) {
                throw exceptionToThrow;
            }
        }
    }
}
