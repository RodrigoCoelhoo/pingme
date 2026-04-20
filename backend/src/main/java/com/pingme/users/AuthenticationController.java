package com.pingme.users;

import com.pingme.security.TokenService;
import com.pingme.security.dto.AuthResponse;
import com.pingme.users.dto.CreateUserRequest;
import com.pingme.users.dto.LocalSignInRequest;
import com.pingme.users.dto.UserResponse;
import jakarta.servlet.http.HttpServletResponse;
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
    public ResponseEntity<UserResponse> signup(@RequestBody CreateUserRequest request) {
        UserResponse response = userService.createUser(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/signin-local")
    public ResponseEntity<AuthResponse> signinLocal(@RequestBody LocalSignInRequest request, HttpServletResponse response) {
        User user = userService.getUserByEmail(request.email());

        authenticationService.checkPassword(request.password(), user.getPassword());

        AuthResponse token = authenticationService.generateAuthToken(user, response);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        AuthResponse response = authenticationService.refresh(refreshToken);
        return ResponseEntity.ok(response);
    }
}
