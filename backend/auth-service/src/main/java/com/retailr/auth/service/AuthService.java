package com.retailr.auth.service;

import com.retailr.auth.dto.LoginResponse;
import com.retailr.auth.dto.UserDTO;
import com.retailr.auth.entity.User;
import com.retailr.auth.exception.AuthException;
import com.retailr.auth.mapper.UserMapper;
import com.retailr.auth.repository.RoleRepository;
import com.retailr.auth.repository.UserRepository;
import com.retailr.auth.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    /**
     * Authenticates a user with email and password.
     * Generates access and refresh tokens upon successful authentication.
     *
     * @param email the user's email
     * @param password the user's password
     * @return LoginResponse containing access token, refresh token, and user info
     * @throws AuthException if user not found or password is invalid
     */
    public LoginResponse login(String email, String password) {
        log.info("Login attempt for email: {}", email);

        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Login failed: user not found for email: {}", email);
                    return new AuthException("Invalid email or password");
                });

        // Validate password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("Login failed: invalid password for email: {}", email);
            throw new AuthException("Invalid email or password");
        }

        // Extract role names
        String roles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.joining(","));

        // Generate tokens
        String accessToken = jwtProvider.generateToken(user.getId(), user.getEmail(), roles);
        String refreshToken = jwtProvider.generateToken(user.getId(), user.getEmail(), roles);

        log.info("Login successful for user: {}", email);

        // Map user to DTO
        LoginResponse.UserDTO userDTO = LoginResponse.UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName())
                        .toList())
                .build();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userDTO)
                .build();
    }

    /**
     * Refreshes an access token using a refresh token.
     *
     * @param refreshToken the refresh token
     * @return a new access token
     * @throws AuthException if refresh token is invalid or user not found
     */
    public String refreshToken(String refreshToken) {
        log.info("Token refresh attempt");

        // Validate refresh token
        if (!jwtProvider.validateToken(refreshToken)) {
            log.warn("Token refresh failed: invalid refresh token");
            throw new AuthException("Invalid refresh token");
        }

        // Extract userId and email from token
        Long userId = jwtProvider.getUserIdFromToken(refreshToken);
        String email = jwtProvider.getEmailFromToken(refreshToken);

        // Find user by id
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("Token refresh failed: user not found with id: {}", userId);
                    return new AuthException("User not found");
                });

        // Extract role names
        String roles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.joining(","));

        // Generate new access token
        String newAccessToken = jwtProvider.generateToken(user.getId(), user.getEmail(), roles);

        log.info("Token refresh successful for user: {}", email);

        return newAccessToken;
    }

    /**
     * Logs out a user (stateless JWT - no-op).
     * Clients are responsible for discarding the token on the frontend.
     */
    public void logout() {
        log.info("User logout (stateless JWT - no action required)");
    }

    /**
     * Retrieves the current user's information by their ID.
     *
     * @param userId the user's ID
     * @return UserDTO containing user information
     * @throws AuthException if user not found
     */
    public UserDTO getCurrentUser(Long userId) {
        log.debug("Retrieving current user with id: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User not found with id: {}", userId);
                    return new AuthException("User not found");
                });

        return userMapper.toDTO(user);
    }
}
