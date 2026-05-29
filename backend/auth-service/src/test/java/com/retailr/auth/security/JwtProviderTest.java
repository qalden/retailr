package com.retailr.auth.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

public class JwtProviderTest {

    private JwtProvider jwtProvider;

    @BeforeEach
    public void setUp() {
        jwtProvider = new JwtProvider();
        ReflectionTestUtils.setField(jwtProvider, "jwtSecret", "my-test-secret-key-that-is-long-enough-for-hs256-algorithm");
        ReflectionTestUtils.setField(jwtProvider, "jwtExpirationMs", 3600000L); // 1 hour
    }

    @Test
    public void testGenerateToken() {
        String token = jwtProvider.generateToken(1L, "test@example.com", "USER");
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    public void testValidateToken() {
        String token = jwtProvider.generateToken(1L, "test@example.com", "USER");
        assertTrue(jwtProvider.validateToken(token));
    }

    @Test
    public void testGetUserIdFromToken() {
        String token = jwtProvider.generateToken(123L, "test@example.com", "USER");
        Long userId = jwtProvider.getUserIdFromToken(token);
        assertEquals(123L, userId);
    }

    @Test
    public void testGetEmailFromToken() {
        String token = jwtProvider.generateToken(1L, "john@example.com", "USER");
        String email = jwtProvider.getEmailFromToken(token);
        assertEquals("john@example.com", email);
    }

    @Test
    public void testInvalidToken() {
        assertFalse(jwtProvider.validateToken("invalid-token"));
    }

    @Test
    public void testExpiredToken() throws InterruptedException {
        ReflectionTestUtils.setField(jwtProvider, "jwtExpirationMs", 1L); // 1 millisecond
        String token = jwtProvider.generateToken(1L, "test@example.com", "USER");
        Thread.sleep(100); // Wait for token to expire
        assertFalse(jwtProvider.validateToken(token));
    }
}
