package com.pingme.shared.presence;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class PresenceTracker {

    private final Map<String, Set<String>> onlineUsers = new ConcurrentHashMap<>();

    public boolean connect(String userId, String sessionId) {

        Set<String> sessions = onlineUsers.computeIfAbsent(
                userId,
                k -> ConcurrentHashMap.newKeySet()
        );

        boolean wasOffline = sessions.isEmpty();

        sessions.add(sessionId);

        return wasOffline;
    }

    public boolean disconnect(String userId, String sessionId) {
        Set<String> sessions = onlineUsers.get(userId);

        if (sessions == null) {
            return false;
        }

        sessions.remove(sessionId);

        if (sessions.isEmpty()) {
            onlineUsers.remove(userId);
            return true;
        }

        return false;
    }

    public boolean isUserOnline(String userId) {
        return onlineUsers.containsKey(userId);
    }

    public Set<String> getOnlineUsers() {
        return Set.copyOf(onlineUsers.keySet());
    }

    public Set<String> filterOnline(Set<String> userIds) {
        return userIds.stream()
                .filter(onlineUsers::containsKey)
                .collect(Collectors.toUnmodifiableSet());
    }
}