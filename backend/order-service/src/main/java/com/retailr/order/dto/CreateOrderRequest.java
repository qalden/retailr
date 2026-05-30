package com.retailr.order.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequest {
    @NotNull(message = "Customer ID cannot be null")
    private Long customerId;

    @NotEmpty(message = "Order must contain at least one line")
    @Valid
    private List<CreateOrderLineRequest> lines;
}
