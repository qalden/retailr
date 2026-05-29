package com.retailr.catalog.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Proxy entity for User from auth-service.
 * Only used for relationship mapping across microservices.
 */
@Entity
@Table(name = "users", schema = "auth")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private Long id;
}
