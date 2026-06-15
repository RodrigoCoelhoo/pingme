package com.pingme.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pingme.config.BaseIntegrationTest;
import com.pingme.config.TestAuthHelper;
import com.pingme.shared.exceptions.InvalidTokenException;
import com.pingme.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTests extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestAuthHelper authHelper;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void cleanDatabase() {
        userRepository.deleteAll();
    }

    // ----------------------------------------------------------------
    // SIGNUP
    // ----------------------------------------------------------------

    @Nested
    class SignUp {
        @Test
        void signup_withValidData_returnsUserProfile() throws Exception {
            var body = Map.of(
                    "email", "newuser@pingme.com",
                    "username", "newuser",
                    "displayName", "New User",
                    "password", "Password-123"
            );

            mockMvc.perform(post("/api/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("newuser@pingme.com"))
                    .andExpect(jsonPath("$.username").value("newuser"));
        }

        @Test
        void signup_withDuplicateEmail_returnsBadRequest() throws Exception {
            authHelper.createUserAndToken("dup");

            var body = Map.of(
                    "email", "test_dup@pingme.com",
                    "username", "differentusername",
                    "displayName", "Another User",
                    "password", "Password-123"
            );

            mockMvc.perform(post("/api/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isConflict());
        }

        @Test
        void signup_withInvalidEmail_returnsBadRequest() throws Exception {
            var body = Map.of(
                    "email", "not-an-email",
                    "username", "someuser",
                    "displayName", "Some User",
                    "password", "Password-123"
            );

            mockMvc.perform(post("/api/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());
        }
    }

    // ----------------------------------------------------------------
    // SIGNIN
    // ----------------------------------------------------------------

    @Nested
    class SignIn {
        @Test
        void signin_withValidCredentials_returnsAccessToken() throws Exception {
            authHelper.createUserAndToken("signin");

            var body = Map.of(
                    "email", "test_signin@pingme.com",
                    "password", "Password-123"
            );

            mockMvc.perform(post("/api/auth/signin-local")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty());
        }

        @Test
        void signin_withWrongPassword_returnsUnauthorized() throws Exception {
            authHelper.createUserAndToken("wrongpw");

            var body = Map.of(
                    "email", "test_wrongpw@pingme.com",
                    "password", "wrongpassword"
            );

            mockMvc.perform(post("/api/auth/signin-local")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void signin_withNonExistentEmail_returnsError() throws Exception {
            var body = Map.of(
                    "email", "nobody@pingme.com",
                    "password", "password123"
            );

            mockMvc.perform(post("/api/auth/signin-local")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isNotFound());
        }
    }

    // ----------------------------------------------------------------
    // ENPOINT PROTECTION
    // ----------------------------------------------------------------

    @Nested
    class EndpointProtection {
        @Test
        void protectedEndpoint_withoutToken_returns401() throws Exception {
            mockMvc.perform(get("/api/chats"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void protectedEndpoint_withValidToken_doesNotReturn401() throws Exception {
            var auth = authHelper.createUserAndToken("protected");

            mockMvc.perform(get("/api/chats")
                            .header("Authorization", auth.bearerToken()))
                    .andExpect(status().is2xxSuccessful());
        }

        @Test
        void protectedEndpoint_withInvalidToken_throwsInvalidTokenException() throws Exception {
            assertThatThrownBy(() ->
                    mockMvc.perform(get("/api/chats")
                            .header("Authorization", "Bearer token.invalido.aqui"))
            )
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessage("Invalid or expired access token");
        }
    }

    // ----------------------------------------------------------------
    // PERSISTENCE
    // ----------------------------------------------------------------

    @Nested
    class Persistence {
        @Test
        void signup_persistsUserInMongoDB() throws Exception {
            var body = Map.of(
                    "email", "persist@pingme.com",
                    "username", "persistuser",
                    "displayName", "Persist User",
                    "password", "Password-123"
            );

            mockMvc.perform(post("/api/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            assertThat(userRepository.findByEmail("persist@pingme.com")).isPresent();
        }
    }
}