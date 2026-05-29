package com.retailr.gateway.config;

import com.retailr.gateway.security.JwtAuthenticationFilter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
            // Auth Service routes (no JWT required for /login and /refresh)
            .route("auth-login", r -> r
                .path("/api/auth/login")
                .and().method(HttpMethod.POST)
                .uri("lb://auth-service"))
            .route("auth-refresh", r -> r
                .path("/api/auth/refresh")
                .and().method(HttpMethod.POST)
                .uri("lb://auth-service"))
            // All other auth endpoints require JWT
            .route("auth-service", r -> r
                .path("/api/auth/**")
                .filters(f -> f.filter(new JwtAuthenticationFilter()))
                .uri("lb://auth-service"))
            // Catalog Service routes (require JWT)
            .route("catalog-service", r -> r
                .path("/api/catalog/**", "/api/products/**", "/api/stock/**", "/api/suppliers/**")
                .filters(f -> f.filter(new JwtAuthenticationFilter()))
                .uri("lb://catalog-service"))
            // Order Service routes (require JWT)
            .route("order-service", r -> r
                .path("/api/orders/**", "/api/customers/**")
                .filters(f -> f.filter(new JwtAuthenticationFilter()))
                .uri("lb://order-service"))
            .build();
    }
}
