package com.retailr.order.service;

import com.retailr.order.entity.OrderStatus;
import com.retailr.order.event.OrderUpdateEvent;
import com.retailr.order.event.OrderUpdateMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

public class RealTimeServiceTest {

    private FakeSimpMessagingTemplate fakeTemplate;
    private RealTimeService realTimeService;

    @BeforeEach
    void setUp() {
        fakeTemplate = new FakeSimpMessagingTemplate();
        realTimeService = new RealTimeService(fakeTemplate);
    }

    @Test
    void publishOrderUpdate_sendsToCorrectTopic() {
        // Arrange
        OrderUpdateEvent event = OrderUpdateEvent.builder()
                .orderNumber("ORD-ABC12345")
                .status(OrderStatus.CONFIRMED)
                .total(new BigDecimal("99.99"))
                .customerName("John Doe")
                .build();

        // Act
        realTimeService.publishOrderUpdate(event);

        // Assert
        assertThat(fakeTemplate.getCapturedTopics()).hasSize(1);
        assertThat(fakeTemplate.getCapturedTopics().get(0)).isEqualTo("/topic/order-updates");
    }

    @Test
    void publishOrderUpdate_includesCorrectFields() {
        // Arrange
        OrderUpdateEvent event = OrderUpdateEvent.builder()
                .orderNumber("ORD-XYZ78910")
                .status(OrderStatus.FULFILLED)
                .total(new BigDecimal("149.50"))
                .customerName("Jane Smith")
                .build();

        // Act
        realTimeService.publishOrderUpdate(event);

        // Assert
        assertThat(fakeTemplate.getCapturedMessages()).hasSize(1);
        OrderUpdateMessage message = fakeTemplate.getCapturedMessages().get(0);
        assertThat(message.getOrderNumber()).isEqualTo("ORD-XYZ78910");
        assertThat(message.getStatus()).isEqualTo("FULFILLED");
        assertThat(message.getTotal()).isEqualTo(new BigDecimal("149.50"));
        assertThat(message.getCustomer()).isEqualTo("Jane Smith");
        assertThat(message.getTimestamp()).isGreaterThan(0);
    }

    @Test
    void publishOrderUpdate_withDifferentStatus() {
        // Test DRAFT status
        testStatusTransition(OrderStatus.DRAFT, "DRAFT");

        // Test CONFIRMED status
        testStatusTransition(OrderStatus.CONFIRMED, "CONFIRMED");

        // Test FULFILLED status
        testStatusTransition(OrderStatus.FULFILLED, "FULFILLED");

        // Test CANCELLED status
        testStatusTransition(OrderStatus.CANCELLED, "CANCELLED");
    }

    private void testStatusTransition(OrderStatus orderStatus, String expectedStatus) {
        // Arrange
        fakeTemplate.reset();
        OrderUpdateEvent event = OrderUpdateEvent.builder()
                .orderNumber("ORD-TEST-" + orderStatus.name())
                .status(orderStatus)
                .total(new BigDecimal("50.00"))
                .customerName("Test Customer")
                .build();

        // Act
        realTimeService.publishOrderUpdate(event);

        // Assert
        assertThat(fakeTemplate.getCapturedMessages()).hasSize(1);
        OrderUpdateMessage message = fakeTemplate.getCapturedMessages().get(0);
        assertThat(message.getStatus()).isEqualTo(expectedStatus);
        assertThat(fakeTemplate.getCapturedTopics().get(0)).isEqualTo("/topic/order-updates");
    }

    /**
     * Fake SimpMessagingTemplate for testing
     */
    static class FakeSimpMessagingTemplate extends SimpMessagingTemplate {

        private final List<String> capturedTopics = new ArrayList<>();
        private final List<OrderUpdateMessage> capturedMessages = new ArrayList<>();

        public FakeSimpMessagingTemplate() {
            super(mock(MessageChannel.class));
        }

        @Override
        public void convertAndSend(String destination, Object payload) {
            capturedTopics.add(destination);
            if (payload instanceof OrderUpdateMessage) {
                capturedMessages.add((OrderUpdateMessage) payload);
            }
        }

        public List<String> getCapturedTopics() {
            return capturedTopics;
        }

        public List<OrderUpdateMessage> getCapturedMessages() {
            return capturedMessages;
        }

        public void reset() {
            capturedTopics.clear();
            capturedMessages.clear();
        }
    }
}
