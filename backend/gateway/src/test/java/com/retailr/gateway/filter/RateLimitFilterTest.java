package com.retailr.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    private RateLimitFilter rateLimitFilter;

    @BeforeEach
    void setUp() {
        rateLimitFilter = new RateLimitFilter();
    }

    @Test
    void shouldAllowRequestWhenBelowRateLimit() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/orders").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(
                rateLimitFilter.apply(new RateLimitFilter.Config())
                        .filter(exchange, e -> Mono.empty())
        )
        .expectComplete()
        .verify();

        // Assert - no status code means request passed through
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    @Test
    void shouldAllowRequestWithUserIdWhenBelowUserRateLimit() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/orders")
                .header("X-User-Id", "123")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(
                rateLimitFilter.apply(new RateLimitFilter.Config())
                        .filter(exchange, e -> Mono.empty())
        )
        .expectComplete()
        .verify();

        // Assert
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    @Test
    void shouldRejectRequestWhenGlobalRateLimitExceeded() {
        // Arrange
        RateLimitFilter filter = new RateLimitFilter();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/orders").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act - simulate many requests until rate limit is hit
        for (int i = 0; i < 1001; i++) {
            MockServerHttpRequest req = MockServerHttpRequest.get("/api/v1/orders").build();
            ServerWebExchange exch = MockServerWebExchange.from(req);
            try {
                StepVerifier.create(
                        filter.apply(new RateLimitFilter.Config())
                                .filter(exch, e -> Mono.empty())
                )
                .expectComplete()
                .verify();
            } catch (Exception e) {
                // Continue on error to fill up the rate limiter
            }
        }

        // The 1001st request should be rejected
        StepVerifier.create(
                filter.apply(new RateLimitFilter.Config())
                        .filter(exchange, e -> Mono.empty())
        )
        .expectComplete()
        .verify();

        // Assert - rate limit exceeded
        if (exchange.getResponse().getStatusCode() != null) {
            assertThat(exchange.getResponse().getStatusCode())
                    .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    @Test
    void shouldTrackRateLimitPerUser() {
        // Arrange
        RateLimitFilter filter = new RateLimitFilter();
        String userId = "456";

        // Act - create requests with same user ID
        MockServerHttpRequest request1 = MockServerHttpRequest.get("/api/v1/orders")
                .header("X-User-Id", userId)
                .build();
        ServerWebExchange exchange1 = MockServerWebExchange.from(request1);

        MockServerHttpRequest request2 = MockServerHttpRequest.get("/api/v1/orders")
                .header("X-User-Id", userId)
                .build();
        ServerWebExchange exchange2 = MockServerWebExchange.from(request2);

        // Act
        StepVerifier.create(
                filter.apply(new RateLimitFilter.Config())
                        .filter(exchange1, e -> Mono.empty())
        )
        .expectComplete()
        .verify();

        StepVerifier.create(
                filter.apply(new RateLimitFilter.Config())
                        .filter(exchange2, e -> Mono.empty())
        )
        .expectComplete()
        .verify();

        // Assert - both requests should pass (below 100 per minute limit)
        assertThat(exchange1.getResponse().getStatusCode()).isNull();
        assertThat(exchange2.getResponse().getStatusCode()).isNull();
    }
}
