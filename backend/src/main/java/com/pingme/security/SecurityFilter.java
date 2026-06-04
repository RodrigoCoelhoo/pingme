package com.pingme.security;

import com.pingme.users.User;
import com.pingme.users.UserRepository;
import com.pingme.users.dto.UserProfile;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService;
    @Autowired
    private UserRepository userRepository;

    private static final List<String> PUBLIC_PATHS = List.of(
            "/actuator",
            "/oauth2",
            "/api/auth/google",
            "/swagger-ui",
            "/v3/api-docs",
            "/swagger-resources",
            "/webjars"
    );

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();

        if (PUBLIC_PATHS.stream().anyMatch(path::startsWith)) {
            filterChain.doFilter(request, response);
            return;
        }

        var token = recoverToken(request);

        if (token != null) {
            var subject = tokenService.validateAccessToken(token);

            if (subject != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                var userOptional = userRepository.findById(subject);

                if (userOptional.isPresent()) {
                    User user = userOptional.get();

                    UserProfile profile = new UserProfile(
                            user.getId(),
                            user.getEmail(),
                            user.getUsername(),
                            user.getDisplayName(),
                            user.getAvatarUrl()
                    );

                    var authentication = new UsernamePasswordAuthenticationToken(
                            profile,
                            null,
                            null
                    );

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    SecurityContextHolder.clearContext();
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String recoverToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        return authHeader.substring(7);
    }
}