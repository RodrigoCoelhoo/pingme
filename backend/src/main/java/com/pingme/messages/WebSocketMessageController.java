package com.pingme.messages;

import com.pingme.chats.members.ChatMemberService;
import com.pingme.exceptions.ForbiddenException;
import com.pingme.messages.dto.MessageRequest;
import com.pingme.messages.dto.MessageResponse;
import com.pingme.messages.dto.TypingIndicator;
import com.pingme.messages.dto.TypingRequest;
import com.pingme.users.User;
import com.pingme.users.UserService;
import com.pingme.users.dto.UserProfile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WebSocketMessageController {

    private final MessageService messageService;
    private final ChatMemberService chatMemberService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Handle incoming messages from clients
     * Client sends to: /app/chat/{chatId}/send
     * Server broadcasts to: /topic/chat/{chatId}
     */
    @MessageMapping("/chat/{chatId}/send")
    public void sendMessage(
            @DestinationVariable String chatId,
            @Payload @Valid MessageRequest request,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        UserProfile user = getUserFromSession(headerAccessor);
        
        try {
            chatMemberService.getChatMember(chatId, user.id());
        } catch (ForbiddenException e) {
            return;
        }

        Message message = messageService.saveMessage(
                chatId,
                user.id(),
                request.content(),
                request.type()
        );

        User sender = userService.getUserById(user.id());
        MessageResponse response = MessageResponse.from(message, sender);

        messagingTemplate.convertAndSend("/topic/chat/" + chatId, response);
    }

    /**
     * Handle typing indicators
     * Client sends to: /app/chat/{chatId}/typing
     * Server broadcasts to: /topic/chat/{chatId}/typing
     */
    @MessageMapping("/chat/{chatId}/typing")
    public void handleTyping(
            @DestinationVariable String chatId,
            @Payload TypingRequest request,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        UserProfile user = getUserFromSession(headerAccessor);
        
        try {
            chatMemberService.getChatMember(chatId, user.id());
        } catch (ForbiddenException e) {
            return;
        }

        TypingIndicator indicator = new TypingIndicator(
                chatId,
                user.id(),
                user.displayName(),
                request.isTyping()
        );

        messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/typing", indicator);
    }

    private UserProfile getUserFromSession(SimpMessageHeaderAccessor headerAccessor) {
        return (UserProfile) headerAccessor.getSessionAttributes().get("user");
    }
}
