package com.retailr.gateway.filter;

import io.github.resilience4j.core.registry.EntryAddedEvent;
import io.github.resilience4j.core.registry.EntryRemovedEvent;
import io.github.resilience4j.core.registry.RegistryEventConsumer;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Rate limiting filter for Spring Cloud Gateway.
 * Enforces request limits per user and globally using Resilience4j.
 *
 * Limits:
 * - 100 requests per minute per user (identified by X-User-Id header)
 * - 1000 requests per minute globally
 * - Returns 429 Too Many Requests when limit is exceeded
 */
@Slf4j
@Component
public class RateLimitFilter extends AbstractGatewayFilterFactory<RateLimitFilter.Config> {

    private static final String GLOBAL_RATE_LIMITER = "global";
    private static final int GLOBAL_LIMIT_PER_MINUTE = 1000;
    private static final int USER_LIMIT_PER_MINUTE = 100;
    private static final Duration REFRESH_PERIOD = Duration.ofMinutes(1);

    private final RateLimiterRegistry rateLimiterRegistry;

    public RateLimitFilter() {
        super(Config.class);
        // Initialize Resilience4j RateLimiterRegistry with default configuration
        this.rateLimiterRegistry = RateLimiterRegistry.of(
                RateLimiterConfig.custom()
                        .limitRefreshPeriod(REFRESH_PERIOD)
                        .limitForPeriod(GLOBAL_LIMIT_PER_MINUTE)
                        .timeoutDuration(Duration.ofSeconds(1))
                        .build()
        );

        // Add event consumer for logging
        rateLimiterRegistry.getEventPublisher()
                .onEntryAdded(this::onRateLimiterAdded)
                .onEntryRemoved(this::onRateLimiterRemoved);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // Check global rate limit first
            RateLimiter globalRateLimiter = rateLimiterRegistry.rateLimiter(GLOBAL_RATE_LIMITER);
            if (!globalRateLimiter.acquirePermission()) {
                log.warn("Global rate limit exceeded for request: {}",
                        exchange.getRequest().getPath());
                exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                return exchange.getResponse().setComplete();
            }

            // Check per-user rate limit if user is authenticated
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null && !userId.isBlank()) {
                String userLimiterId = "user-" + userId;
                RateLimiter userRateLimiter = rateLimiterRegistry.rateLimiter(
                        userLimiterId,
                        RateLimiterConfig.custom()
                                .limitRefreshPeriod(REFRESH_PERIOD)
                                .limitForPeriod(USER_LIMIT_PER_MINUTE)
                                .timeoutDuration(Duration.ofSeconds(1))
                                .build()
                );

                if (!userRateLimiter.acquirePermission()) {
                    log.warn("User rate limit exceeded for userId: {} at path: {}",
                            userId, exchange.getRequest().getPath());
                    exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                    return exchange.getResponse().setComplete();
                }
                log.debug("User {} rate limit check passed", userId);
            }

            log.debug("Rate limit check passed for path: {}", exchange.getRequest().getPath());
            return chain.filter(exchange);
        };
    }

    /**
     * Callback when a rate limiter is added to registry.
     */
    private void onRateLimiterAdded(EntryAddedEvent<RateLimiter> event) {
        RateLimiter rateLimiter = event.getAddedEntry();
        log.debug("Rate limiter created with limit {} requests per minute",
                rateLimiter.getRateLimiterConfig().getLimitForPeriod());
    }

    /**
     * Callback when a rate limiter is removed from registry.
     */
    private void onRateLimiterRemoved(EntryRemovedEvent<RateLimiter> event) {
        log.debug("Rate limiter removed");
    }

    /**
     * Configuration class for rate limit filter.
     * Can be extended in the future for per-route configuration.
     */
    public static class Config {
        // Configuration can be extended for per-route rate limit settings
    }
}
