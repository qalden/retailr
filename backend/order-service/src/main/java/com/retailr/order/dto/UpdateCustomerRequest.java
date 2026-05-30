package com.retailr.order.dto;

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
public class UpdateCustomerRequest {
    @NotBlank(message = "Customer name cannot be blank")
    private String name;

    @Email(message = "Email should be valid")
    private String email;

    private String phone;
    private String address;
    private String city;
    private String postalCode;
}
