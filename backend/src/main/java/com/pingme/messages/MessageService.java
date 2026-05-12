package com.pingme.messages;

import com.pingme.exceptions.ResourceNotFound;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;

    public Message getMessage(String messageId) {
        return messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFound("Message not found"));
    }

    public List<Message> getMessagesByIds(List<String> messageIds) {
        if (messageIds == null || messageIds.isEmpty()) {
            return List.of();
        }
        return messageRepository.findAllById(messageIds);
    }
}