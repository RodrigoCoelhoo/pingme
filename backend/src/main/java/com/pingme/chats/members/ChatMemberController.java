package com.pingme.chats.members;

import com.pingme.chats.members.dto.AddMembers;
import com.pingme.chats.members.dto.UpdateRole;
import com.pingme.users.dto.UserProfile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
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
        log.debug("POST /api/chat-members/{}/read [userId={}, messageId={}]", chatId, user.id(), messageId);
        chatMemberService.markAsRead(chatId, user.id(), messageId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{chatId}/leave")
    public ResponseEntity<Void> leaveChat(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId
    ) {
        log.debug("POST /api/chat-members/{}/leave [userId={}]", chatId, user.id());
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
        log.debug(
                "PATCH /api/chat-members/{}/update-role [userId={}, targetId={}, role={}]",
                chatId,
                user.id(),
                data.userId(),
                data.role()
        );
        chatMemberService.updateRole(chatId, user.id(), data);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{chatId}/kick/{memberId}")
    public ResponseEntity<Void> kickMember(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @PathVariable String memberId
    ) {
        log.debug("POST /api/chat-members/{}/kick/{} [userId={}]", chatId, memberId, user.id());
        chatMemberService.kickMember(chatId, user.id(), memberId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{chatId}/add-members")
    public ResponseEntity<Void> addMembers(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @Valid @RequestBody AddMembers data
    ) {
        log.debug(
                "POST /api/chat-members/{}/add-members [userId={}, count={}]",
                chatId,
                user.id(),
                data.memberIds().size()
        );
        chatMemberService.addMembers(chatId, user.id(), data.memberIds());
        return ResponseEntity.noContent().build();
    }

}