package com.retailr.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;

/**
 * JWT Authentication filter for Spring Cloud Gateway.
 * Validates JWT tokens from the Authorization header and injects user claims
 * into downstream request headers.
 */
@Slf4j
@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    @Value("${jwt.secret:my-test-secret-key-that-is-long-enough-for-hs256-algorithm}")
    private String jwtSecret;

    public JwtAuthenticationFilter() {
        super(Config.class);
    }

    /**
     * Set JWT secret (used for testing).
     */
    public void setJwtSecret(String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // Extract Authorization header
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            // If no auth header, reject with 401
            if (authHeader == null || authHeader.isBlank()) {
                log.info("Missing authorization header for path: {}", exchange.getRequest().getPath());
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // Extract token from "Bearer {token}" format
            String token = null;
            if (authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            } else {
                log.warn("Invalid authorization header format for path: {}", exchange.getRequest().getPath());
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // Validate and extract claims from token
            try {
                Claims claims = validateTokenAndGetClaims(token);
                log.debug("JWT token validated successfully for user: {}", claims.getSubject());

                // Add user claims to request headers for downstream services
                var mutatedRequest = exchange.getRequest().mutate()
                        .header("X-User-Id", claims.get("userId", Long.class).toString())
                        .header("X-User-Email", claims.getSubject())
                        .header("X-User-Role", claims.get("role", String.class))
                        .build();

                var mutatedExchange = exchange.mutate().request(mutatedRequest).build();
                log.info("Request authenticated for user: {} at path: {}",
                        claims.getSubject(), exchange.getRequest().getPath());
                return chain.filter(mutatedExchange);

            } catch (JwtException e) {
                log.warn("JWT validation failed: {}", e.getMessage());
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            } catch (Exception e) {
                log.error("Unexpected error during JWT validation: {}", e.getMessage(), e);
                exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
                return exchange.getResponse().setComplete();
            }
        };
    }

    /**
     * Validates JWT token and extracts claims.
     *
     * @param token JWT token to validate
     * @return Claims from the token
     * @throws JwtException if token is invalid or expired
     */
    private Claims validateTokenAndGetClaims(String token) throws JwtException {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Configuration class for JWT filter.
     */
    public static class Config {
        // Configuration can be extended in the future
    }
}
