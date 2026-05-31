package com.pingme.shared;

import com.pingme.shared.events.Event;
import com.pingme.messages.dto.MessageResponse;
import com.pingme.shared.presence.PresenceEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WebsocketBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastMessage(List<String> recipientIds, MessageResponse response) {
        for (String memberId : recipientIds) {
            messagingTemplate.convertAndSendToUser(memberId, "/queue/messages", response);
        }
    }

    public void broadcastEvent(List<String> recipientIds, Event event) {
        for (String memberId : recipientIds) {
            messagingTemplate.convertAndSendToUser(memberId, "/queue/events", event);
        }
    }

    public void broadcastPresence(List<String> recipientIds, PresenceEvent event) {
        for (String memberId : recipientIds) {
            messagingTemplate.convertAndSendToUser(memberId, "/queue/presence", event);
        }
    }
}