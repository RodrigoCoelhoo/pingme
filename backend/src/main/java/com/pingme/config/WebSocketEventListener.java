package com.pingme.config;

import com.pingme.contacts.ContactService;
import com.pingme.shared.WebsocketBroadcaster;
import com.pingme.shared.metrics.WebsocketMetrics;
import com.pingme.shared.presence.PresenceEvent;
import com.pingme.shared.presence.PresenceStatus;
import com.pingme.shared.presence.PresenceTracker;
import com.pingme.users.User;
import com.pingme.users.UserRepository;
import com.pingme.users.UserService;
import com.pingme.users.dto.UserProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final PresenceTracker presenceTracker;
    private final ContactService contactService;
    private final WebsocketBroadcaster websocketBroadcaster;
    private final UserService userService;
    private final WebsocketMetrics websocketMetrics;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();

        if (sessionAttributes == null) {
            return;
        }

        UserProfile user = (UserProfile) sessionAttributes.get("user");

        if (user == null) {
            return;
        }

        boolean becameOnline = presenceTracker.connect(
                user.id(),
                headerAccessor.getSessionId()
        );
        websocketMetrics.connectionOpened();

        if(becameOnline) {
            PresenceEvent presenceEvent = new PresenceEvent(
                    user.id(),
                    PresenceStatus.ONLINE,
                    null
            );

            List<String> contacts = contactService.getAcceptedContactIds(user.id());
            websocketBroadcaster.broadcastPresence(contacts, presenceEvent);
        }

        log.info("User connected: {}", user.username());
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {

        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();

        if (sessionAttributes == null) {
            return;
        }

        UserProfile user = (UserProfile) sessionAttributes.get("user");

        if (user == null) {
            return;
        }

        boolean becameOffline = presenceTracker.disconnect(
                user.id(),
                headerAccessor.getSessionId()
        );
        websocketMetrics.connectionClosed();

        if (becameOffline) {
            Instant lastSeenAt = Instant.now();
            User dbUser = userService.getUserById(user.id());

            dbUser.setLastSeenAt(lastSeenAt);
            dbUser = userService.save(dbUser);

            PresenceEvent presenceEvent = new PresenceEvent(
                    dbUser.getId(),
                    PresenceStatus.OFFLINE,
                    dbUser.getLastSeenAt()
            );

            List<String> contacts = contactService.getAcceptedContactIds(dbUser.getId());
            websocketBroadcaster.broadcastPresence(contacts, presenceEvent);
        }

        log.info("User disconnected: {}", user.username());
    }
}