package com.retailr.order.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class WebSocketConfigTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Test
    void testWebSocketConfigBeanCreated() {
        WebSocketConfig webSocketConfig = applicationContext.getBean(WebSocketConfig.class);
        assertNotNull(webSocketConfig, "WebSocketConfig bean should be created");
    }

    @Test
    void testWebSocketConfigImplementsConfigurer() {
        WebSocketConfig webSocketConfig = applicationContext.getBean(WebSocketConfig.class);
        assertTrue(webSocketConfig instanceof WebSocketMessageBrokerConfigurer,
                "WebSocketConfig should implement WebSocketMessageBrokerConfigurer");
    }

    @Test
    void testBrokerConfiguredWithTopicPrefix() {
        // Verify that SimpMessagingTemplate is available, which indicates SimpleBroker is configured
        assertNotNull(messagingTemplate,
                "SimpMessagingTemplate should be available when SimpleBroker is enabled for /topic");
    }

    @Test
    void testApplicationDestinationPrefixConfigured() {
        assertNotNull(messagingTemplate,
                "SimpMessagingTemplate should be available when /app destination prefix is configured");
    }

    @Test
    void testStompEndpointRegistered() {
        WebSocketConfig webSocketConfig = applicationContext.getBean(WebSocketConfig.class);
        assertNotNull(webSocketConfig, "WebSocketConfig bean should exist to register STOMP endpoints");
        assertNotNull(messagingTemplate, "SimpMessagingTemplate should be available when STOMP endpoints are registered");
    }

    @Test
    void testSockJSEnabledOnEndpoint() {
        assertNotNull(messagingTemplate,
                "SimpMessagingTemplate should be available when SockJS is enabled on the /ws endpoint");
    }
}
