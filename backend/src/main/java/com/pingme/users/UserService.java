package com.pingme.users;

import com.pingme.users.dto.CreateUserRequest;
import com.pingme.users.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse register(CreateUserRequest request) {

        String email = request.email().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already in use");
        }

        if (userRepository.existsByUsername(request.username())) {
            throw new RuntimeException("Username already taken");
        }

        String encryptedPassword = passwordEncoder.encode(request.password());

        User user = User.builder()
                .email(email)
                .username(request.username())
                .password(encryptedPassword)
                .displayName(request.displayName())
                .lastSeenAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        return mapToResponse(user);
    }

    public UserResponse getById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return mapToResponse(user);
    }

    public UserResponse getByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return mapToResponse(user);
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl()
        );
    }
}