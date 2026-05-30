package com.retailr.catalog.service;

import com.retailr.catalog.dto.CreateSupplierRequest;
import com.retailr.catalog.dto.SupplierDTO;
import com.retailr.catalog.dto.UpdateSupplierRequest;
import com.retailr.catalog.entity.Supplier;
import com.retailr.catalog.repository.SupplierRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SupplierService {
    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public SupplierDTO createSupplier(CreateSupplierRequest request) {
        Supplier supplier = Supplier.builder()
            .name(request.getName())
            .contactPerson(request.getContactPerson())
            .email(request.getEmail())
            .phone(request.getPhone())
            .address(request.getAddress())
            .build();

        Supplier saved = supplierRepository.save(supplier);
        return toDTO(saved);
    }

    public SupplierDTO getSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + id));
        return toDTO(supplier);
    }

    public Page<SupplierDTO> listSuppliers(Pageable pageable) {
        return supplierRepository.findAll(pageable)
            .map(this::toDTO);
    }

    public SupplierDTO updateSupplier(Long id, UpdateSupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + id));

        if (request.getName() != null) {
            supplier.setName(request.getName());
        }
        if (request.getContactPerson() != null) {
            supplier.setContactPerson(request.getContactPerson());
        }
        if (request.getEmail() != null) {
            supplier.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            supplier.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            supplier.setAddress(request.getAddress());
        }

        Supplier saved = supplierRepository.save(supplier);
        return toDTO(saved);
    }

    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + id));
        supplierRepository.delete(supplier);
    }

    private SupplierDTO toDTO(Supplier supplier) {
        return SupplierDTO.builder()
            .id(supplier.getId())
            .name(supplier.getName())
            .contactPerson(supplier.getContactPerson())
            .email(supplier.getEmail())
            .phone(supplier.getPhone())
            .address(supplier.getAddress())
            .createdAt(supplier.getCreatedAt())
            .updatedAt(supplier.getUpdatedAt())
            .build();
    }
}
