package com.retailr.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LowStockAlertDTO {
    private Long id;
    private Long stockItemId;
    private java.time.LocalDateTime triggeredAt;
    private java.time.LocalDateTime acknowledgedAt;
    private Long acknowledgedByUserId;
}
