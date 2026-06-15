package com.pingme.messages;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pingme.chats.Chat;
import com.pingme.chats.ChatRepository;
import com.pingme.chats.ChatType;
import com.pingme.chats.members.ChatMember;
import com.pingme.chats.members.ChatMemberRepository;
import com.pingme.chats.members.ChatRole;
import com.pingme.config.BaseIntegrationTest;
import com.pingme.config.TestAuthHelper;
import com.pingme.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MessageIntegrationTests extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private ChatMemberRepository chatMemberRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private TestAuthHelper authHelper;
    @Autowired private ObjectMapper objectMapper;

    private TestAuthHelper.AuthResult userA;
    private TestAuthHelper.AuthResult userB;
    private String chatId;

    @BeforeEach
    void setup() {
        messageRepository.deleteAll();
        chatMemberRepository.deleteAll();
        chatRepository.deleteAll();
        userRepository.deleteAll();

        userA = authHelper.createUserAndToken("msgA");
        userB = authHelper.createUserAndToken("msgB");

        Chat chat = chatRepository.save(Chat.builder()
                .chatType(ChatType.GROUP)
                .chatName("Test Chat")
                .imageUrl("")
                .createdAt(Instant.now())
                .build());

        chatId = chat.getId();

        chatMemberRepository.save(ChatMember.builder()
                .chatId(chatId)
                .userId(userA.user().getId())
                .role(ChatRole.ADMIN)
                .active(true)
                .muted(false)
                .build());

        chatMemberRepository.save(ChatMember.builder()
                .chatId(chatId)
                .userId(userB.user().getId())
                .role(ChatRole.MEMBER)
                .active(true)
                .muted(false)
                .build());
    }

    // ----------------------------------------------------------------
    // GET MESSAGES
    // ----------------------------------------------------------------

    @Nested
    class GetMessages {
        @Test
        void getMessages_asMember_returnsOk() throws Exception {
            mockMvc.perform(get("/api/chats/" + chatId + "/messages")
                            .header("Authorization", userA.bearerToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }

        @Test
        void getMessages_asNonMember_returnsForbidden() throws Exception {
            var outsider = authHelper.createUserAndToken("outsider");

            mockMvc.perform(get("/api/chats/" + chatId + "/messages")
                            .header("Authorization", outsider.bearerToken()))
                    .andExpect(status().isForbidden());
        }

        @Test
        void getMessages_returnsMessagesInCorrectOrder() throws Exception {
            messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userA.user().getId())
                    .content("First message")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now().minusSeconds(10))
                    .deleted(false)
                    .build());

            messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userA.user().getId())
                    .content("Second message")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now())
                    .deleted(false)
                    .build());

            mockMvc.perform(get("/api/chats/" + chatId + "/messages")
                            .header("Authorization", userA.bearerToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(2))
                    .andExpect(jsonPath("$.content[0].content").value("First message"))
                    .andExpect(jsonPath("$.content[1].content").value("Second message"));
        }
    }

    // ----------------------------------------------------------------
    // EDIT MESSAGE
    // ----------------------------------------------------------------

    @Nested
    class EditMessage {
        @Test
        void editMessage_byOwner_updatesContent() throws Exception {
            Message message = messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userA.user().getId())
                    .content("Original content")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now())
                    .deleted(false)
                    .build());

            var body = Map.of(
                    "content", "Updated content",
                    "type", "TEXT"
            );

            mockMvc.perform(patch("/api/chats/" + chatId + "/messages/" + message.getId())
                            .header("Authorization", userA.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").value("Updated content"));

            Message updated = messageRepository.findById(message.getId()).orElseThrow();
            assertThat(updated.getContent()).isEqualTo("Updated content");
            assertThat(updated.getEditedAt()).isNotNull();
        }

        @Test
        void editMessage_byOtherUser_returnsForbidden() throws Exception {
            Message message = messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userA.user().getId())
                    .content("Original content")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now())
                    .deleted(false)
                    .build());

            var body = Map.of(
                    "content", "Hacked content",
                    "type", "TEXT"
            );

            mockMvc.perform(patch("/api/chats/" + chatId + "/messages/" + message.getId())
                            .header("Authorization", userB.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void editMessage_deletedMessage_returnsBadRequest() throws Exception {
            Message message = messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userA.user().getId())
                    .content("")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now())
                    .deleted(true)
                    .build());

            var body = Map.of("content", "Trying to edit deleted");

            mockMvc.perform(patch("/api/chats/" + chatId + "/messages/" + message.getId())
                            .header("Authorization", userA.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void editMessage_withEmptyContent_returnsBadRequest() throws Exception {
            Message message = messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userA.user().getId())
                    .content("Original")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now())
                    .deleted(false)
                    .build());

            var body = Map.of("content", "   ");

            mockMvc.perform(patch("/api/chats/" + chatId + "/messages/" + message.getId())
                            .header("Authorization", userA.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void editMessage_withInvalidType_returnsBadRequest() throws Exception {
            Message message = messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userA.user().getId())
                    .content("Original content")
                    .type(MessageType.FILE)
                    .createdAt(Instant.now())
                    .deleted(false)
                    .build());

            var body = Map.of(
                    "content", "Updated content",
                    "type", "FILE"
            );

            mockMvc.perform(patch("/api/chats/" + chatId + "/messages/" + message.getId())
                            .header("Authorization", userA.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());
        }
    }

    // ----------------------------------------------------------------
    // DELETE MESSAGE
    // ----------------------------------------------------------------

    @Nested
    class DeleteMessage {
        @Test
        void deleteMessage_byOwner_marksAsDeleted() throws Exception {
            Message message = messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userA.user().getId())
                    .content("To be deleted")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now())
                    .deleted(false)
                    .build());

            mockMvc.perform(delete("/api/chats/" + chatId + "/messages/" + message.getId())
                            .header("Authorization", userA.bearerToken()))
                    .andExpect(status().isNoContent());

            Message deleted = messageRepository.findById(message.getId()).orElseThrow();
            assertThat(deleted.isDeleted()).isTrue();
            assertThat(deleted.getContent()).isEmpty();
        }

        @Test
        void deleteMessage_byAdmin_succeedsEvenIfNotOwner() throws Exception {
            Message message = messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userB.user().getId())
                    .content("Member message")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now())
                    .deleted(false)
                    .build());

            mockMvc.perform(delete("/api/chats/" + chatId + "/messages/" + message.getId())
                            .header("Authorization", userA.bearerToken()))
                    .andExpect(status().isNoContent());

            Message deleted = messageRepository.findById(message.getId()).orElseThrow();
            assertThat(deleted.isDeleted()).isTrue();
        }

        @Test
        void deleteMessage_byMemberNotOwner_returnsForbidden() throws Exception {
            Message message = messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userA.user().getId())
                    .content("Admin message")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now())
                    .deleted(false)
                    .build());

            mockMvc.perform(delete("/api/chats/" + chatId + "/messages/" + message.getId())
                            .header("Authorization", userB.bearerToken()))
                    .andExpect(status().isForbidden());
        }

        @Test
        void deleteMessage_alreadyDeleted_returnsBadRequest() throws Exception {
            Message message = messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userA.user().getId())
                    .content("")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now())
                    .deleted(true)
                    .build());

            mockMvc.perform(delete("/api/chats/" + chatId + "/messages/" + message.getId())
                            .header("Authorization", userA.bearerToken()))
                    .andExpect(status().isBadRequest());
        }
    }

    // ----------------------------------------------------------------
    // MARK AS READ
    // ----------------------------------------------------------------

    @Nested
    class MarkMessageAsRead {
        @Test
        void markAsRead_asMember_returnsNoContent() throws Exception {
            Message message = messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(userA.user().getId())
                    .content("Read me")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now())
                    .deleted(false)
                    .build());

            mockMvc.perform(patch("/api/chats/" + chatId + "/messages/read")
                            .header("Authorization", userB.bearerToken())
                            .param("lastMessageId", message.getId()))
                    .andExpect(status().isNoContent());
        }
    }
}