package com.pingme.users;

import com.pingme.exceptions.ResourceAlreadyExistsException;
import com.pingme.exceptions.ResourceNotFound;
import com.pingme.users.dto.CreateUserRequest;
import com.pingme.users.dto.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfile createUser(CreateUserRequest request) {

        String email = request.email().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ResourceAlreadyExistsException("Email already in use");
        }

        String username = request.username().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new ResourceAlreadyExistsException("Username already taken");
        }

        String encryptedPassword = passwordEncoder.encode(request.password());

        User user = User.builder()
                .email(email)
                .username(request.username())
                .password(encryptedPassword)
                .displayName(request.displayName())
                .lastSeenAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFound("User with Email: '" + email + "' not found"));
    }

    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFound("User with ID: '" + id + "' not found"));
    }

    private UserProfile mapToResponse(User user) {
        return new UserProfile(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl()
        );
    }
}