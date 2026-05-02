package com.pingme.contacts;

import com.pingme.contacts.dto.ContactDTO;
import com.pingme.contacts.dto.ContactRequestResponse;
import com.pingme.contacts.dto.ContactResponse;
import com.pingme.contacts.dto.UpdateContactDTO;
import com.pingme.users.dto.UserProfile;
import com.pingme.utils.PageResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @GetMapping
    public ResponseEntity<PageResponseDTO<ContactResponse>> getContacts(
            @AuthenticationPrincipal UserProfile user,
            @RequestParam(required = true) ContactStatus status,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        List<ContactResponse> response = contactService.getContacts(user, status, page, limit);
        return ResponseEntity.ok(PageResponseDTO.format(response, page, limit));
    }

    @PostMapping
    public ResponseEntity<ContactRequestResponse> createContactRequest(
            @AuthenticationPrincipal UserProfile user,
            @RequestBody @Valid ContactDTO data
    ) {
        Contact response = contactService.createContactRequest(user, data);
        return ResponseEntity.ok(ContactRequestResponse.format(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateContactRequest(
            @AuthenticationPrincipal UserProfile user,
            @PathVariable String id,
            @RequestBody @Valid UpdateContactDTO status
    ) {
        contactService.updateContactRequest(user, id, status.status());
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
