package com.pingme.contacts;

import com.pingme.contacts.dto.ContactDTO;
import com.pingme.contacts.dto.ContactResponse;
import com.pingme.shared.presence.PresenceTracker;
import com.pingme.users.dto.UserProfile;
import com.pingme.shared.utils.PagedResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;
    private final PresenceTracker presenceTracker;

    @GetMapping
    public ResponseEntity<PagedResponse<ContactResponse>> getContacts(
            @AuthenticationPrincipal UserProfile user,
            @RequestParam ContactStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PendingType pendingType
    ) {
        log.debug("GET /api/contacts [userId={}, status={}, page={}, limit={}]", user.id(), status, page, limit);
        return ResponseEntity.ok(contactService.getContacts(user, status, page, limit, search, pendingType));
    }

    @PostMapping
    public ResponseEntity<ContactResponse> createContactRequest(
            @AuthenticationPrincipal UserProfile user,
            @RequestBody @Valid ContactDTO data
    ) {
        log.debug("POST /api/contacts [userId={}, targetUsername={}]", user.id(), data.username());
        ContactResponse response = contactService.createContactRequest(user, data);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateContactRequest(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String id,
            @RequestParam ContactAction action
    ) {
        log.debug("PUT /api/contacts/{} [userId={}, action={}]", id, user.id(), action);
        contactService.handleContactRequest(user, id, action);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String id
    ) {
        log.debug("DELETE /api/contacts/{} [userId={}]", id, user.id());
        contactService.deleteContact(user, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/online")
    public ResponseEntity<Set<String>> onlineContacts(@AuthenticationPrincipal UserProfile user) {
        log.debug("GET /api/contacts/online [userId={}]", user.id());
        List<String> allContacts = contactService.getAcceptedContactIds(user.id());
        Set<String> onlineUsers = presenceTracker.filterOnline(new HashSet<>(allContacts));
        log.debug("Online contacts resolved [userId={}, onlineCount={}]", user.id(), onlineUsers.size());
        return ResponseEntity.ok(onlineUsers);
    }
}
