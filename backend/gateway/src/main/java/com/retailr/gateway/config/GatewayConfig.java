package com.retailr.gateway.config;

import com.retailr.gateway.filter.RateLimitFilter;
import com.retailr.gateway.security.JwtAuthenticationFilter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Gateway configuration for routing requests to backend microservices.
 *
 * Route structure:
 * 1. Auth routes (/api/v1/auth/**) - PUBLIC, no JWT required
 * 2. Catalog routes (/api/v1/products/**, /api/v1/suppliers/**, /api/v1/categories/**) - PUBLIC, no JWT
 * 3. Stock routes (/api/v1/stock/**) - PROTECTED, JWT required
 * 4. Order routes (/api/v1/orders/**, /api/v1/customers/**) - PROTECTED, JWT required
 *
 * All routes:
 * - Strip /api/v1 prefix before forwarding to backend services
 * - Enforce rate limiting
 * - Protected routes validate JWT token
 */
@Slf4j
@Configuration
public class GatewayConfig {

    // Issue 4: Create static config instances to reuse across all routes
    private static final JwtAuthenticationFilter.Config JWT_CONFIG = new JwtAuthenticationFilter.Config();
    private static final RateLimitFilter.Config RATE_LIMIT_CONFIG = new RateLimitFilter.Config();

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;

    public GatewayConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                        RateLimitFilter rateLimitFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitFilter = rateLimitFilter;
    }

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
            // ========== PUBLIC ROUTES (No JWT required) ==========

            // Auth Service - Public endpoints (login, refresh, register)
            .route("auth-service", r -> r
                .path("/api/v1/auth/**")
                .filters(f -> f
                        .stripPrefix(1)
                        .filter(rateLimitFilter.apply(RATE_LIMIT_CONFIG))
                )
                .uri("http://localhost:8081"))

            // Catalog Service - Public endpoints (products, suppliers, categories)
            .route("catalog-public", r -> r
                .path("/api/v1/products/**", "/api/v1/suppliers/**", "/api/v1/categories/**")
                .filters(f -> f
                        .stripPrefix(1)
                        .filter(rateLimitFilter.apply(RATE_LIMIT_CONFIG))
                )
                .uri("http://localhost:8082"))

            // ========== PROTECTED ROUTES (JWT required) ==========

            // Catalog Service - Protected endpoint (stock management)
            .route("stock-service", r -> r
                .path("/api/v1/stock/**")
                .filters(f -> f
                        .stripPrefix(1)
                        .filter(jwtAuthenticationFilter.apply(JWT_CONFIG))
                        .filter(rateLimitFilter.apply(RATE_LIMIT_CONFIG))
                )
                .uri("http://localhost:8082"))

            // Order Service - All endpoints require JWT (orders, customers)
            .route("order-service", r -> r
                .path("/api/v1/orders/**", "/api/v1/customers/**")
                .filters(f -> f
                        .stripPrefix(1)
                        .filter(jwtAuthenticationFilter.apply(JWT_CONFIG))
                        .filter(rateLimitFilter.apply(RATE_LIMIT_CONFIG))
                )
                .uri("http://localhost:8083"))

            .build();
    }
}
