package com.pingme.security;

import com.pingme.security.dto.AuthResponse;
import com.pingme.users.AuthenticationService;
import com.pingme.users.User;
import com.pingme.users.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;
    private final AuthenticationService authenticationService;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String providerId = oAuth2User.getAttribute("sub");
        String email      = oAuth2User.getAttribute("email");
        String name       = oAuth2User.getAttribute("name");
        String avatarUrl  = oAuth2User.getAttribute("picture");
        log.info("Google authentication successful [email={}, providerId={}]", email, providerId);

        User user = userService.findOrCreateGoogleUser(providerId, email, name, avatarUrl);
        log.info("OAuth user resolved [userId={}, email={}]", user.getId(), user.getEmail());

        AuthResponse token = authenticationService.generateAuthToken(user, response, "Lax");

        ResponseCookie accessCookie = ResponseCookie.from("accessToken", token.accessToken())
                .httpOnly(false)
                .secure(false)
                .path("/")
                .maxAge(30)
                .sameSite("Lax")
                .build();

        log.debug("OAuth login completed [userId={}, redirect={}]", user.getId(), frontendUrl);

        response.addHeader("Set-Cookie", accessCookie.toString());
        response.sendRedirect(frontendUrl + "/auth/callback?token=" + token.accessToken());
    }
}
