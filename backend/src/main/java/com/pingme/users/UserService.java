package com.pingme.users;

import com.pingme.shared.cloudinary.CloudinaryService;
import com.pingme.shared.cloudinary.CloudinaryUploadResult;
import com.pingme.shared.exceptions.ForbiddenException;
import com.pingme.shared.exceptions.ResourceAlreadyExistsException;
import com.pingme.shared.exceptions.ResourceNotFound;
import com.pingme.users.dto.CreateUserRequest;
import com.pingme.users.dto.UpdateUserRequest;
import com.pingme.users.dto.UserProfile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;

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
                .lastSeenAt(Instant.now())
                .build();

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFound("User with Email: '" + email + "' not found"));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFound("User with Username: '" + username + "' not found"));
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

    public List<User> getUsersByIds(Set<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return userRepository.findAllById(userIds);
    }

    public UserProfile updateUser(String userId, UpdateUserRequest request, MultipartFile file) throws IOException {
        User user = getUserById(userId);

        if (request != null && request.displayName() != null) {
            user.setDisplayName(request.displayName());
        }

        if (file != null && !file.isEmpty()) {

            if (user.getAvatarPublicId() != null) {
                cloudinaryService.deleteImage(user.getAvatarPublicId());
            }

            CloudinaryUploadResult result = cloudinaryService.uploadProfilePicture(file);
            user.setAvatarUrl(result.secureUrl());
            user.setAvatarPublicId(result.publicId());
        }

        User saved = userRepository.save(user);
        return new UserProfile(
                saved.getId(),
                saved.getEmail(),
                saved.getUsername(),
                saved.getDisplayName(),
                saved.getAvatarUrl()
        );
    }

    public User save(User dbUser) {
        return userRepository.save(dbUser);
    }
}