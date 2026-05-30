package com.retailr.catalog.dto;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSupplierRequest {
    private String name;

    private String contactPerson;

    @Email(message = "Email should be valid")
    private String email;

    private String phone;

    private String address;
}
