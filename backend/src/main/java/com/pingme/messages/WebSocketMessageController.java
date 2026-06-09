package com.pingme.messages;

import com.pingme.chats.Chat;
import com.pingme.chats.ChatService;
import com.pingme.chats.ChatType;
import com.pingme.chats.members.ChatMemberService;
import com.pingme.shared.exceptions.ForbiddenException;
import com.pingme.messages.dto.MessageRequest;
import com.pingme.messages.dto.MessageResponse;
import com.pingme.messages.dto.TypingIndicator;
import com.pingme.messages.dto.TypingRequest;
import com.pingme.shared.metrics.MessageMetrics;
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

import java.util.List;
import java.util.Objects;

@Controller
@RequiredArgsConstructor
public class WebSocketMessageController {

    private final MessageService messageService;
    private final ChatMemberService chatMemberService;
    private final ChatService chatService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageMetrics messageMetrics;

    /**
     * Handle incoming messages from clients
     * Client sends to: /app/chat/{chatId}/send
     * Server sends user-specific messages to: /user/queue/messages
     */
    @MessageMapping("/chat/{chatId}/send")
    public void sendMessage(
            @DestinationVariable String chatId,
            @Payload @Valid MessageRequest request,
            SimpMessageHeaderAccessor headerAccessor
    ) throws Exception {
        UserProfile user = getUserFromSession(headerAccessor);

        Chat chat;
        try {
            chat = chatService.getChat(chatId, user.id());
        } catch (ForbiddenException e) {
            messageMetrics.recordMessageFailure("forbidden");
            return;
        }

        if(chat == null) return;

        Message message = Objects.requireNonNull(
                messageMetrics.messageSaveTimer().recordCallable(() ->
                        messageService.saveMessage(
                                chatId,
                                user.id(),
                                request.content(),
                                request.type()
                        )
                )
        );

        if(chat.getChatType() == ChatType.PRIVATE) {
            chatMemberService.activateChatMembersByChat(chatId);
        }

        User sender = userService.getUserById(user.id());
        MessageResponse response = MessageResponse.from(message, sender);

        List<String> memberIds = chatMemberService.getMemberIds(chatId);
        messageMetrics.wsDeliveryTimer().record(() -> {
            for (String memberId : memberIds) {
                messagingTemplate.convertAndSendToUser(memberId, "/queue/messages", response);
            }
        });

        messageMetrics.recordMessageSent(chat.getChatType().name());
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
