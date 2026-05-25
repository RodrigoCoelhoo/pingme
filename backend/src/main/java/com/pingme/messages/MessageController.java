package com.pingme.messages;

import com.pingme.chats.members.ChatMemberService;
import com.pingme.messages.dto.MessageResponse;
import com.pingme.users.User;
import com.pingme.users.UserService;
import com.pingme.users.dto.UserProfile;
import com.pingme.shared.utils.PagedResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
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
        chatMemberService.getChatMember(chatId, userProfile.id());

        List<MessageResponse> responses =
                messageService.sendFileMessages(
                        chatId,
                        userProfile.id(),
                        files
                );

        return ResponseEntity.ok(responses);
    }
}