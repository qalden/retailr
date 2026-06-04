package com.retailr.catalog.service;

import com.retailr.catalog.event.StockUpdateEvent;
import com.retailr.catalog.event.StockUpdateMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RealTimeServiceTest {

    private RealTimeService realTimeService;
    private FakeSimpMessagingTemplate fakeSimpMessagingTemplate;

    @BeforeEach
    void setUp() {
        fakeSimpMessagingTemplate = new FakeSimpMessagingTemplate();
        realTimeService = new RealTimeService(fakeSimpMessagingTemplate);
    }

    @Test
    void publishStockUpdate_sendsToCorrectTopic() {
        StockUpdateEvent event = StockUpdateEvent.builder()
            .productId(1L)
            .warehouseId(2L)
            .previousQuantity(100)
            .newQuantity(100)
            .sku("SKU-001")
            .warehouse("Warehouse A")
            .reservedQuantity(10)
            .alert(false)
            .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
            .timestamp(LocalDateTime.now())
            .build();

        realTimeService.publishStockUpdate(event);

        assertEquals(1, fakeSimpMessagingTemplate.getSentMessages().size());
        assertEquals("/topic/stock-updates", fakeSimpMessagingTemplate.getSentMessages().get(0).getTopic());
        assertEquals("SKU-001", ((StockUpdateMessage) fakeSimpMessagingTemplate.getSentMessages().get(0).getMessage()).getSku());
    }

    @Test
    void publishStockUpdate_includesCorrectFields() {
        StockUpdateEvent event = StockUpdateEvent.builder()
            .productId(2L)
            .warehouseId(3L)
            .previousQuantity(100)
            .newQuantity(50)
            .sku("SKU-002")
            .warehouse("Warehouse B")
            .reservedQuantity(5)
            .alert(true)
            .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
            .timestamp(LocalDateTime.now())
            .build();

        realTimeService.publishStockUpdate(event);

        assertEquals(1, fakeSimpMessagingTemplate.getSentMessages().size());
        FakeSimpMessagingTemplate.Message msg = fakeSimpMessagingTemplate.getSentMessages().get(0);
        StockUpdateMessage message = (StockUpdateMessage) msg.getMessage();

        assertEquals("/topic/stock-updates", msg.getTopic());
        assertEquals("SKU-002", message.getSku());
        assertEquals("Warehouse B", message.getWarehouse());
        assertEquals(50, message.getQuantity());
        assertEquals(5, message.getReserved());
        assertTrue(message.isAlert());
        assertTrue(message.getTimestamp() > 0);
    }

    @Test
    void publishStockUpdate_withoutAlert() {
        StockUpdateEvent event = StockUpdateEvent.builder()
            .productId(3L)
            .warehouseId(4L)
            .previousQuantity(100)
            .newQuantity(200)
            .sku("SKU-003")
            .warehouse("Warehouse C")
            .reservedQuantity(0)
            .alert(false)
            .movementType(StockUpdateEvent.MovementType.ADJUSTMENT)
            .timestamp(LocalDateTime.now())
            .build();

        realTimeService.publishStockUpdate(event);

        assertEquals(1, fakeSimpMessagingTemplate.getSentMessages().size());
        StockUpdateMessage message = (StockUpdateMessage) fakeSimpMessagingTemplate.getSentMessages().get(0).getMessage();
        assertFalse(message.isAlert());
    }

    /**
     * Simple test stub of SimpMessagingTemplate.
     * Records calls to convertAndSend for verification in tests.
     */
    static class FakeSimpMessagingTemplate extends SimpMessagingTemplate {

        private List<Message> sentMessages = new ArrayList<>();

        public FakeSimpMessagingTemplate() {
            super(new NullMessageChannel());
        }

        @Override
        public void convertAndSend(String destination, Object payload) {
            sentMessages.add(new Message(destination, payload));
        }

        public List<Message> getSentMessages() {
            return sentMessages;
        }

        static class Message {
            private String topic;
            private Object message;

            public Message(String topic, Object message) {
                this.topic = topic;
                this.message = message;
            }

            public String getTopic() {
                return topic;
            }

            public Object getMessage() {
                return message;
            }
        }
    }

    /**
     * Null message channel for testing.
     */
    static class NullMessageChannel implements org.springframework.messaging.MessageChannel {
        @Override
        public boolean send(org.springframework.messaging.Message<?> message) {
            return true;
        }

        @Override
        public boolean send(org.springframework.messaging.Message<?> message, long timeout) {
            return true;
        }
    }
}
