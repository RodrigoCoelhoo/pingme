package com.pingme.users;

import com.pingme.shared.presence.PresenceService;
import com.pingme.users.dto.UpdateUserRequest;
import com.pingme.users.dto.UserProfile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfile> me(@AuthenticationPrincipal UserProfile user) {
        return ResponseEntity.ok(user);
    }

    @PatchMapping
    public ResponseEntity<UserProfile> updateUser(
            @AuthenticationPrincipal UserProfile userProfile,
            @RequestPart(value = "data", required = false) @Valid UpdateUserRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        UserProfile response = userService.updateUser(userProfile.id(), request, file);
        return ResponseEntity.ok(response);
    }


}
