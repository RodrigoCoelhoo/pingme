package com.pingme.config;

import com.pingme.users.UserRepository;
import com.pingme.users.dto.UserProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final UserRepository userRepository;
    
    // In-memory store: userId -> sessionId
    private final Map<String, String> onlineUsers = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        
        if (sessionAttributes != null) {
            UserProfile user = (UserProfile) sessionAttributes.get("user");
            
            if (user != null) {
                String sessionId = headerAccessor.getSessionId();
                onlineUsers.put(user.id(), sessionId);
                
                log.info("User connected: {} (session: {})", user.username(), sessionId);
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        
        if (sessionAttributes != null) {
            UserProfile user = (UserProfile) sessionAttributes.get("user");
            
            if (user != null) {
                onlineUsers.remove(user.id());
                
                // Update lastSeenAt in database
                userRepository.findById(user.id()).ifPresent(dbUser -> {
                    dbUser.setLastSeenAt(LocalDateTime.now());
                    userRepository.save(dbUser);
                });
                
                log.info("User disconnected: {} (session: {})", user.username(), headerAccessor.getSessionId());
            }
        }
    }

    /**
     * Check if a user is currently online
     */
    public boolean isUserOnline(String userId) {
        return onlineUsers.containsKey(userId);
    }

    /**
     * Get all online user IDs
     */
    public Map<String, String> getOnlineUsers() {
        return new ConcurrentHashMap<>(onlineUsers);
    }
}
