package com.retailr.catalog.repository;

import com.retailr.catalog.entity.Warehouse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class WarehouseRepositoryTest {
    @Autowired
    private WarehouseRepository warehouseRepository;

    @Test
    void testSaveWarehouse() {
        Warehouse warehouse = Warehouse.builder()
            .name("Main Warehouse")
            .location("New York")
            .build();

        Warehouse saved = warehouseRepository.save(warehouse);

        assertNotNull(saved.getId());
        assertEquals("Main Warehouse", saved.getName());
        assertEquals("New York", saved.getLocation());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    void testFindByName() {
        Warehouse warehouse = Warehouse.builder()
            .name("Test Warehouse")
            .location("Boston")
            .build();
        warehouseRepository.save(warehouse);

        Optional<Warehouse> found = warehouseRepository.findByName("Test Warehouse");

        assertTrue(found.isPresent());
        assertEquals("Test Warehouse", found.get().getName());
        assertEquals("Boston", found.get().getLocation());
    }

    @Test
    void testFindByNameNotFound() {
        Optional<Warehouse> found = warehouseRepository.findByName("NonExistent");
        assertTrue(found.isEmpty());
    }

    @Test
    void testUpdateWarehouse() {
        Warehouse warehouse = Warehouse.builder()
            .name("Original Warehouse")
            .location("New York")
            .build();
        Warehouse saved = warehouseRepository.save(warehouse);

        Long originalId = saved.getId();
        java.time.LocalDateTime originalCreatedAt = saved.getCreatedAt();

        // Update location
        saved.setLocation("Los Angeles");
        warehouseRepository.save(saved);

        Optional<Warehouse> updated = warehouseRepository.findById(originalId);

        assertTrue(updated.isPresent());
        assertEquals("Los Angeles", updated.get().getLocation());
        // Verify createdAt is immutable
        assertEquals(originalCreatedAt, updated.get().getCreatedAt());
    }
}
