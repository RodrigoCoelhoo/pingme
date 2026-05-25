package com.pingme.messages;

import com.pingme.chats.events.ChatEvent;
import com.pingme.messages.dto.MessageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastMessage(List<String> recipientIds, MessageResponse response) {
        for (String memberId : recipientIds) {
            messagingTemplate.convertAndSendToUser(memberId, "/queue/messages", response);
        }
    }

    public void broadcastEvent(List<String> recipientIds, ChatEvent event) {
        for (String memberId : recipientIds) {
            messagingTemplate.convertAndSendToUser(memberId, "/queue/events", event);
        }
    }
}