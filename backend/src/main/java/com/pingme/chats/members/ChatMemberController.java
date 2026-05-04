package com.pingme.chats.members;

import com.pingme.users.dto.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/chat-members")
@RequiredArgsConstructor
public class ChatMemberController {

    private final ChatMemberService chatMemberService;

    @PostMapping("/{chatId}/read")
    public void markAsRead(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @RequestParam String messageId
    ) {
        chatMemberService.markAsRead(chatId, user.id(), messageId);
    }

    @PutMapping("/{chatId}/leave")
    public void leaveChat(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId
    ) {
        chatMemberService.leaveChat(chatId, user.id());
    }
}