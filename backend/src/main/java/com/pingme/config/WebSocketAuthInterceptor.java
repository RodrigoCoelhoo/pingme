package com.pingme.config;

import com.pingme.security.TokenService;
import com.pingme.users.User;
import com.pingme.users.UserRepository;
import com.pingme.users.dto.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final TokenService tokenService;
    private final UserRepository userRepository;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) throws Exception {
        
        if (request instanceof ServletServerHttpRequest servletRequest) {
            String token = servletRequest.getServletRequest().getParameter("token");
            
            if (token != null) {
                try {
                    String userId = tokenService.validateAccessToken(token);
                    
                    if (userId != null) {
                        User user = userRepository.findById(userId).orElse(null);
                        
                        if (user != null) {
                            UserProfile profile = new UserProfile(
                                    user.getId(),
                                    user.getEmail(),
                                    user.getUsername(),
                                    user.getDisplayName(),
                                    user.getAvatarUrl()
                            );

                            attributes.put("user", profile);
                            return true;
                        }
                    }
                } catch (Exception e) {
                    // Invalid token
                    return false;
                }
            }
        }
        
        return false; // Reject connection if no valid token
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
        // Nothing to do after handshake
    }
}
