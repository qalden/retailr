package com.retailr.catalog.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSupplierRequest {
    @NotBlank(message = "Supplier name cannot be blank")
    private String name;

    @NotBlank(message = "Contact person cannot be blank")
    private String contactPerson;

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Phone cannot be blank")
    private String phone;

    @NotBlank(message = "Address cannot be blank")
    private String address;
}
