package com.retailr.auth.controller;

import com.retailr.auth.dto.LoginRequest;
import com.retailr.auth.dto.LoginResponse;
import com.retailr.auth.dto.RefreshTokenRequest;
import com.retailr.auth.dto.RefreshTokenResponse;
import com.retailr.auth.dto.UserDTO;
import com.retailr.auth.security.JwtProvider;
import com.retailr.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller exposing authentication endpoints.
 * Handles login, logout, token refresh, and user profile retrieval.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final JwtProvider jwtProvider;

    /**
     * POST /api/auth/login
     * Authenticates a user with email and password.
     *
     * @param loginRequest the login credentials (email and password)
     * @return LoginResponse with access token, refresh token, and user info
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Login request for email: {}", loginRequest.getEmail());
        LoginResponse response = authService.login(loginRequest.getEmail(), loginRequest.getPassword());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/refresh
     * Refreshes an access token using a refresh token.
     *
     * @param refreshTokenRequest contains the refresh token
     * @return RefreshTokenResponse with new access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest refreshTokenRequest) {
        log.info("Token refresh request");
        String newAccessToken = authService.refreshToken(refreshTokenRequest.getRefreshToken());
        RefreshTokenResponse response = RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/logout
     * Logs out a user (stateless JWT - no-op on server side).
     * Clients are responsible for discarding the token.
     *
     * @return 204 No Content
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        log.info("Logout request");
        authService.logout();
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/auth/me
     * Retrieves the current user's information using the JWT token.
     *
     * @param authHeader the Authorization header containing the Bearer token
     * @return UserDTO with the current user's information
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        log.info("Get current user request");
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtProvider.getUserIdFromToken(token);
        UserDTO user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }
}
