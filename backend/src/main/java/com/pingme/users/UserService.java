package com.pingme.users;

import com.pingme.shared.cloudinary.CloudinaryService;
import com.pingme.shared.cloudinary.CloudinaryUploadResult;
import com.pingme.shared.exceptions.ResourceAlreadyExistsException;
import com.pingme.shared.exceptions.ResourceNotFound;
import com.pingme.users.dto.CreateUserRequest;
import com.pingme.users.dto.UpdateUserRequest;
import com.pingme.users.dto.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
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

    public User findOrCreateGoogleUser(String providerId, String email, String name, String avatarUrl) {
        return userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, providerId)
                .orElseGet(() -> findLocalOrCreate(email, name, avatarUrl, providerId));
    }

    private User findLocalOrCreate(String email, String name, String avatarUrl, String providerId) {
        return userRepository.findByEmail(email)
                .map(existing -> syncGoogleFields(existing, providerId, avatarUrl)) // conta local existe → sync único
                .orElseGet(() -> createGoogleUser(email, name, avatarUrl, providerId)); // conta nova → cria
    }

    private User syncGoogleFields(User user, String providerId, String avatarUrl) {
        boolean changed = false;

        if (user.getProvider() == AuthProvider.LOCAL) {
            user.setProvider(AuthProvider.GOOGLE);
            user.setProviderId(providerId);
            changed = true;
        }
        if (avatarUrl != null && user.getAvatarUrl() == null) {
            user.setAvatarUrl(avatarUrl);
            changed = true;
        }
        return changed ? userRepository.save(user) : user;
    }

    private User createGoogleUser(String email, String name, String avatarUrl, String providerId) {
        String baseUsername = email.split("@")[0].replaceAll("[^A-Za-z0-9_-]", "_");
        String username = ensureUniqueUsername(baseUsername);

        User user = User.builder()
                .email(email)
                .username(username)
                .displayName(name != null ? name : username)
                .avatarUrl(avatarUrl)
                .provider(AuthProvider.GOOGLE)
                .providerId(providerId)
                .build();

        return userRepository.save(user);
    }

    private String ensureUniqueUsername(String base) {
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }
}