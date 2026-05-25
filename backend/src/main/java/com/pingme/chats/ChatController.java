package com.pingme.chats;

import com.pingme.chats.dto.ChatDTO;
import com.pingme.chats.dto.ChatMemberResponse;
import com.pingme.chats.dto.ChatPreview;
import com.pingme.chats.dto.UpdateChatRequest;
import com.pingme.chats.members.ChatMemberService;
import com.pingme.users.dto.UpdateUserRequest;
import com.pingme.users.dto.UserProfile;
import com.pingme.shared.utils.PagedResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("api/chats")
@RequiredArgsConstructor
@Validated
public class ChatController {

    private final ChatService chatService;
    private final ChatMemberService chatMemberService;

    @PostMapping("/private/{targetId}")
    public ResponseEntity<ChatPreview> getOrCreatePrivateChat(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String targetId
    ) {
        ChatPreview chat = chatService.getOrCreatePrivateChat(user.id(), targetId);
        return ResponseEntity.ok(chat);
    }

    @PostMapping("/group")
    public ResponseEntity<ChatPreview> createGroupChat(
            @AuthenticationPrincipal UserProfile user,
            @RequestBody @Valid ChatDTO dto
    ) {
        ChatPreview response = chatService.createGroupChat(
                user.id(),
                dto.membersIds(),
                dto.chatName()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<PagedResponse<ChatPreview>> getMyChats(
            @AuthenticationPrincipal UserProfile user,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size,
            @RequestParam(required = false) String search
    ) {
        PagedResponse<ChatPreview> response = chatService.getUserChats(
                user.id(),
                page,
                size,
                search
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<ChatPreview> getChatById(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId
    ) {
        ChatPreview response = chatService.getChatPreviewById(user.id(), chatId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{chatId}/members")
    public ResponseEntity<PagedResponse<ChatMemberResponse>> getChatMembers(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(chatService.getChatMembers(user.id(), chatId, page, size, search));
    }

    @DeleteMapping("/{chatId}")
    public ResponseEntity<Void> deleteChat(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId
    ) {
        chatService.deleteChat(user.id(), chatId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{chatId}")
    public ResponseEntity<ChatPreview> updateChat(
            @PathVariable String chatId,
            @AuthenticationPrincipal UserProfile userProfile,
            @RequestPart(value = "data", required = false) @Valid UpdateChatRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        ChatPreview response = chatService.updateChat(userProfile.id(), chatId, request, file);
        return ResponseEntity.ok(response);
    }
}