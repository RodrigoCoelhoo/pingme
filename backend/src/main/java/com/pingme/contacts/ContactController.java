package com.pingme.contacts;

import com.pingme.contacts.dto.ContactDTO;
import com.pingme.contacts.dto.ContactResponse;
import com.pingme.users.dto.UserProfile;
import com.pingme.shared.utils.PagedResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @GetMapping
    public ResponseEntity<PagedResponse<ContactResponse>> getContacts(
            @AuthenticationPrincipal UserProfile user,
            @RequestParam ContactStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PendingType pendingType
    ) {
        return ResponseEntity.ok(contactService.getContacts(user, status, page, limit, search, pendingType));
    }

    @PostMapping
    public ResponseEntity<ContactResponse> createContactRequest(
            @AuthenticationPrincipal UserProfile user,
            @RequestBody @Valid ContactDTO data
    ) {
        ContactResponse response = contactService.createContactRequest(user, data);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateContactRequest(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String id,
            @RequestParam ContactAction action
    ) {
        contactService.handleContactRequest(user, id, action);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String id
    ) {
        contactService.deleteContact(user, id);
        return ResponseEntity.noContent().build();
    }
}
