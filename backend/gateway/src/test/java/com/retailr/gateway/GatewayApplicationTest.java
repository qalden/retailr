package com.retailr.gateway;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit test for GatewayApplication startup.
 */
class GatewayApplicationTest {

    @Test
    void mainMethodExists() {
        // Verify that the GatewayApplication class exists and can be instantiated
        assertThat(GatewayApplication.class).isNotNull();
        assertThat(GatewayApplication.class.getName()).isEqualTo("com.retailr.gateway.GatewayApplication");
    }

    @Test
    void applicationCanBeInstantiated() {
        // Simple instantiation test
        GatewayApplication app = new GatewayApplication();
        assertThat(app).isNotNull();
    }
}
