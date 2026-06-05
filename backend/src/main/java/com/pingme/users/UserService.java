package com.pingme.users;

import com.pingme.shared.cloudinary.CloudinaryService;
import com.pingme.shared.cloudinary.CloudinaryUploadResult;
import com.pingme.shared.exceptions.ResourceAlreadyExistsException;
import com.pingme.shared.exceptions.ResourceNotFound;
import com.pingme.users.dto.CreateUserRequest;
import com.pingme.users.dto.UpdateUserRequest;
import com.pingme.users.dto.UserProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;

    @Transactional
    public UserProfile createUser(CreateUserRequest request) {
        String email = request.email().toLowerCase();
        String username = request.username().toLowerCase();

        log.info("Creating user [email={}, username={}]", email, username);

        if (userRepository.existsByEmail(email)) {
            log.warn("Email already exists [email={}]", email);
            throw new ResourceAlreadyExistsException("Email already in use");
        }

        if (userRepository.existsByUsername(username)) {
            log.warn("Username already exists [username={}]", username);
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

        log.info(
                "User created [userId={}, username={}]",
                savedUser.getId(),
                savedUser.getUsername()
        );

        return mapToResponse(savedUser);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User not found [email={}]", email);
                    return new ResourceNotFound("User with Email: '" + email + "' not found");
                });
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User not found [username={}]", username);
                    return new ResourceNotFound("User with Username: '" + username + "' not found");
                });
    }

    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User not found [userId={}]", id);
                    return new ResourceNotFound("User with ID: '" + id + "' not found");
                });
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
        log.info("Updating user [userId={}]", userId);

        User user = getUserById(userId);

        if (request != null && request.displayName() != null) {
            log.debug("Updating display name [userId={}]", userId);
            user.setDisplayName(request.displayName());
        }

        if (file != null && !file.isEmpty()) {
            log.debug("Uploading avatar [userId={}]", userId);

            if (user.getAvatarPublicId() != null) {
                cloudinaryService.deleteImage(user.getAvatarPublicId());
            }

            CloudinaryUploadResult result = cloudinaryService.uploadProfilePicture(file);
            user.setAvatarUrl(result.secureUrl());
            user.setAvatarPublicId(result.publicId());
        }

        User saved = userRepository.save(user);

        log.info("User updated [userId={}]", saved.getId());
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

    @Transactional
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