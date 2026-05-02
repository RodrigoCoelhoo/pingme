package com.pingme.chats;

import com.pingme.chats.dto.ChatDTO;
import com.pingme.chats.dto.ChatPreview;
import com.pingme.users.dto.UserProfile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/private/{targetId}")
    public ResponseEntity<ChatPreview> getOrCreatePrivateChat(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String targetId
    ) {
        ChatPreview chat = chatService.getOrCreatePrivateChat(user.id(), targetId);
        return ResponseEntity.ok(chat);
    }

    @PostMapping("/group")
    public ResponseEntity<?> createGroupChat(
            @AuthenticationPrincipal UserProfile user,
            @RequestBody @Valid ChatDTO dto
    ) {
        Chat chat = chatService.createGroupChat(
                user.id(),
                dto.membersIds(),
                dto.chatName()
        );

        return ResponseEntity.ok(chat);
    }

    @GetMapping
    public ResponseEntity<List<ChatPreview>> getMyChats(
            @AuthenticationPrincipal UserProfile user
    ) {
        return ResponseEntity.ok(
                chatService.getUserChats(user.id())
        );
    }
}