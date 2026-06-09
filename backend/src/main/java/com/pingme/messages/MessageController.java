package com.pingme.messages;

import com.pingme.chats.members.ChatMemberService;
import com.pingme.messages.dto.MessageRequest;
import com.pingme.messages.dto.MessageResponse;
import com.pingme.users.User;
import com.pingme.users.UserService;
import com.pingme.users.dto.UserProfile;
import com.pingme.shared.utils.PagedResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("api/chats/{chatId}/messages")
@RequiredArgsConstructor
@Validated
public class MessageController {

    private final MessageService messageService;
    private final ChatMemberService chatMemberService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<PagedResponse<MessageResponse>> getMessages(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size
    ) {
        chatMemberService.getChatMember(chatId, user.id());
        Page<Message> messagePage = messageService.getMessagesByChatId(chatId, page, size);

        Set<String> senderIds = messagePage.getContent().stream()
                .map(Message::getSenderId)
                .collect(Collectors.toSet());

        Map<String, User> userMap = userService.getUsersByIds(senderIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<MessageResponse> responses = messagePage.getContent().stream()
                .sorted(Comparator.comparing(Message::getCreatedAt))
                .map(msg ->
                        msg.getType() == MessageType.SYSTEM
                                ? MessageResponse.system(msg)
                                : MessageResponse.from(msg, userMap.get(msg.getSenderId()))
                )
                .toList();

        return ResponseEntity.ok(new PagedResponse<>(
                responses,
                page,
                size,
                messagePage.getTotalElements(),
                messagePage.getTotalPages(),
                messagePage.hasNext()
        ));
    }

    @PatchMapping("/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @RequestParam String lastMessageId
    ) {
        chatMemberService.markAsRead(chatId, user.id(), lastMessageId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<MessageResponse>> sendFilesMessages(
            @AuthenticationPrincipal UserProfile userProfile,
            @PathVariable String chatId,
            @RequestPart("files") List<MultipartFile> files
    ) throws IOException {
        log.debug(
                "POST /api/chats/{}/messages/files [userId={}, fileCount={}]",
                chatId,
                userProfile.id(),
                files.size()
        );
        chatMemberService.getChatMember(chatId, userProfile.id());

        List<MessageResponse> responses =
                messageService.sendFileMessages(
                        chatId,
                        userProfile.id(),
                        files
                );

        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/{messageId}")
    public ResponseEntity<MessageResponse> editMessage(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @PathVariable String messageId,
            @RequestBody @Valid MessageRequest request
    ) {
        log.debug(
                "PATCH /api/chats/{}/messages/{} [userId={}]",
                chatId,
                messageId,
                user.id()
        );

        MessageResponse response = messageService.editMessage(chatId, messageId, user.id(), request.content());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String chatId,
            @PathVariable String messageId
    ) {
        log.debug(
                "DELETE /api/chats/{}/messages/{} [userId={}]",
                chatId,
                messageId,
                user.id()
        );

        messageService.deleteMessage(chatId, messageId, user.id());
        return ResponseEntity.noContent().build();
    }
}