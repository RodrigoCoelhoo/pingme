package com.pingme.users;

import com.pingme.users.dto.CreateUserRequest;
import com.pingme.users.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public UserResponse register(@RequestBody CreateUserRequest request) {
        return userService.register(request);
    }
}