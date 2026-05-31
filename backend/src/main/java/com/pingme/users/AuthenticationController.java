package com.pingme.users;

import com.pingme.security.dto.AuthResponse;
import com.pingme.users.dto.CreateUserRequest;
import com.pingme.users.dto.LocalSignInRequest;
import com.pingme.users.dto.UserProfile;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final UserService userService;
    private final AuthenticationService authenticationService;

    @PostMapping("/signup")
    public ResponseEntity<UserProfile> signup(
            @RequestBody @Valid CreateUserRequest request
    ) {
        UserProfile response = userService.createUser(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signin-local")
    public ResponseEntity<AuthResponse> signinLocal(
            @RequestBody @Valid LocalSignInRequest request,
            HttpServletResponse response
    ) {
        User user = userService.getUserByEmail(request.email());

        authenticationService.checkPassword(request.password(), user.getPassword());

        AuthResponse token = authenticationService.generateAuthToken(user, response, "Strict");
        return ResponseEntity.ok(token);
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(
            HttpServletResponse response
    ) {
        authenticationService.logout(response);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        AuthResponse response = authenticationService.refresh(refreshToken);
        return ResponseEntity.ok(response);
    }
}
