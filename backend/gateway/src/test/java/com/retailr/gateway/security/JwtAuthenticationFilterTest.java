package com.retailr.gateway.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.crypto.SecretKey;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthenticationFilterTest {

    private JwtAuthenticationFilter jwtFilter;
    private String validToken;
    private String expiredToken;
    private static final String SECRET = "my-test-secret-key-that-is-long-enough-for-hs256-algorithm";
    private static final long USER_ID = 123L;
    private static final String USER_EMAIL = "test@example.com";
    private static final String USER_ROLE = "USER";

    @BeforeEach
    void setUp() {
        jwtFilter = new JwtAuthenticationFilter();
        jwtFilter.setJwtSecret(SECRET);
        validToken = generateToken(1000);  // expires in 1 second
        expiredToken = generateToken(-1000); // already expired
    }

    @Test
    void shouldAcceptRequestWithValidToken() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/orders")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + validToken)
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(
                jwtFilter.apply(new JwtAuthenticationFilter.Config())
                        .filter(exchange, e -> Mono.empty())
        )
        .expectComplete()
        .verify();

        // Assert
        assertThat(exchange.getRequest().getHeaders().getFirst("X-User-Id")).isEqualTo(String.valueOf(USER_ID));
        assertThat(exchange.getRequest().getHeaders().getFirst("X-User-Email")).isEqualTo(USER_EMAIL);
        assertThat(exchange.getRequest().getHeaders().getFirst("X-User-Role")).isEqualTo(USER_ROLE);
    }

    @Test
    void shouldRejectRequestWithoutAuthorizationHeader() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/orders").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(
                jwtFilter.apply(new JwtAuthenticationFilter.Config())
                        .filter(exchange, e -> Mono.empty())
        )
        .expectComplete()
        .verify();

        // Assert
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void shouldRejectRequestWithInvalidTokenFormat() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/orders")
                .header(HttpHeaders.AUTHORIZATION, "InvalidFormat token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(
                jwtFilter.apply(new JwtAuthenticationFilter.Config())
                        .filter(exchange, e -> Mono.empty())
        )
        .expectComplete()
        .verify();

        // Assert
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void shouldRejectRequestWithInvalidToken() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/orders")
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.token.here")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(
                jwtFilter.apply(new JwtAuthenticationFilter.Config())
                        .filter(exchange, e -> Mono.empty())
        )
        .expectComplete()
        .verify();

        // Assert
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void shouldRejectExpiredToken() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/orders")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken)
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(
                jwtFilter.apply(new JwtAuthenticationFilter.Config())
                        .filter(exchange, e -> Mono.empty())
        )
        .expectComplete()
        .verify();

        // Assert
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    /**
     * Generates a JWT token for testing.
     *
     * @param expirationOffsetMs milliseconds from now (positive = future, negative = past)
     * @return JWT token string
     */
    private String generateToken(long expirationOffsetMs) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());
        return Jwts.builder()
                .subject(USER_EMAIL)
                .claim("userId", USER_ID)
                .claim("role", USER_ROLE)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationOffsetMs))
                .signWith(key)
                .compact();
    }
}
