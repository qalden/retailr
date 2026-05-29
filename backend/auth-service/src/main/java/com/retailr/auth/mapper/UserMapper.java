package com.retailr.auth.mapper;

import com.retailr.auth.dto.UserDTO;
import com.retailr.auth.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserDTO toDTO(User user) {
        return UserDTO.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .roles(user.getRoles().stream()
                .map(role -> role.getName())
                .toList())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
