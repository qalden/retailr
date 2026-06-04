package com.retailr.catalog.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockUpdateMessage {
    private String sku;
    private String warehouse;
    private Integer quantity;
    private Integer reserved;
    private boolean alert;
    private long timestamp;
}
