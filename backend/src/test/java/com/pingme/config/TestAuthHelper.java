package com.pingme.config;

import com.pingme.security.TokenService;
import com.pingme.users.AuthProvider;
import com.pingme.users.User;
import com.pingme.users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class TestAuthHelper {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthResult createUserAndToken(String suffix) {
        User user = User.builder()
                .email("test_" + suffix + "@pingme.com")
                .username("testuser_" + suffix)
                .displayName("Test User " + suffix)
                .password(passwordEncoder.encode("Password-123"))
                .provider(AuthProvider.LOCAL)
                .build();

        User saved = userRepository.save(user);
        String token = tokenService.generateAccessToken(saved);

        return new AuthResult(saved, token);
    }

    public record AuthResult(User user, String token) {
        public String bearerToken() {
            return "Bearer " + token;
        }
    }
}