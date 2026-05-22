package com.pingme.chats.members;

import com.pingme.chats.members.dto.AddMembers;
import com.pingme.chats.members.dto.UpdateRole;
import com.pingme.exceptions.BadRequestException;
import com.pingme.users.dto.UserProfile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/chat-members")
@RequiredArgsConstructor
public class ChatMemberController {

    private final ChatMemberService chatMemberService;

    @PostMapping("/{chatId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @RequestParam String messageId
    ) {
        chatMemberService.markAsRead(chatId, user.id(), messageId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{chatId}/leave")
    public ResponseEntity<Void> leaveChat(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId
    ) {
        chatMemberService.leaveChat(chatId, user.id());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{chatId}/mute")
    public ResponseEntity<Void> muteChat(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId
    ) {
        chatMemberService.muteChat(chatId, user.id());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{chatId}/update-role")
    public ResponseEntity<Void> updateRole(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @Valid @RequestBody UpdateRole data
    ) {
        chatMemberService.updateRole(chatId, user.id(), data);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{chatId}/kick/{memberId}")
    public ResponseEntity<Void> kickMember(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @PathVariable String memberId
    ) {
        chatMemberService.kickMember(chatId, user.id(), memberId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{chatId}/add-members")
    public ResponseEntity<Void> addMembers(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @Valid @RequestBody AddMembers data
    ) {
        chatMemberService.addMembers(chatId, user.id(), data.memberIds());
        return ResponseEntity.noContent().build();
    }

}