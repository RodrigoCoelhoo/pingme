package com.pingme.chats;

import com.pingme.chats.members.ChatMember;
import com.pingme.chats.members.ChatMemberRepository;
import com.pingme.chats.members.ChatRole;
import com.pingme.config.BaseIntegrationTest;
import com.pingme.config.TestAuthHelper;
import com.pingme.messages.Message;
import com.pingme.messages.MessageRepository;
import com.pingme.messages.MessageType;
import com.pingme.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ChatIntegrationTests extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private ChatMemberRepository chatMemberRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private TestAuthHelper authHelper;

    private TestAuthHelper.AuthResult admin;
    private TestAuthHelper.AuthResult member;
    private String chatId;

    @BeforeEach
    void setup() {
        messageRepository.deleteAll();
        chatMemberRepository.deleteAll();
        chatRepository.deleteAll();
        userRepository.deleteAll();

        admin = authHelper.createUserAndToken("chatAdmin");
        member = authHelper.createUserAndToken("chatMember");

        Chat chat = chatRepository.save(Chat.builder()
                .chatType(ChatType.GROUP)
                .chatName("Test Group")
                .imageUrl("")
                .build());

        chatId = chat.getId();

        chatMemberRepository.save(ChatMember.builder()
                .chatId(chatId)
                .userId(admin.user().getId())
                .role(ChatRole.ADMIN)
                .active(true)
                .muted(false)
                .build());

        chatMemberRepository.save(ChatMember.builder()
                .chatId(chatId)
                .userId(member.user().getId())
                .role(ChatRole.MEMBER)
                .active(true)
                .muted(false)
                .build());
    }

    // ----------------------------------------------------------------
    // GET CHATS
    // ----------------------------------------------------------------

    @Nested
    class GetChats {
        @Test
        void getMyChats_asMember_returnsChats() throws Exception {
            mockMvc.perform(get("/api/chats")
                            .header("Authorization", admin.bearerToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].chatName").value("Test Group"));
        }

        @Test
        void getMyChats_withNoMemberships_returnsEmpty() throws Exception {
            var outsider = authHelper.createUserAndToken("outsider");

            mockMvc.perform(get("/api/chats")
                            .header("Authorization", outsider.bearerToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(0));
        }

        @Test
        void getMyChats_withSearch_filtersCorrectly() throws Exception {
            Chat otherChat = chatRepository.save(Chat.builder()
                    .chatType(ChatType.GROUP)
                    .chatName("Another Chat")
                    .imageUrl("")
                    .build());

            chatMemberRepository.save(ChatMember.builder()
                    .chatId(otherChat.getId())
                    .userId(admin.user().getId())
                    .role(ChatRole.ADMIN)
                    .active(true)
                    .muted(false)
                    .build());

            mockMvc.perform(get("/api/chats")
                            .header("Authorization", admin.bearerToken())
                            .param("search", "Test"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].chatName").value("Test Group"));
        }
    }

    // ----------------------------------------------------------------
    // GET CHAT BY ID
    // ----------------------------------------------------------------

    @Nested
    class GetChatById {
        @Test
        void getChatById_asMember_returnsChat() throws Exception {
            mockMvc.perform(get("/api/chats/" + chatId)
                            .header("Authorization", member.bearerToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.chatName").value("Test Group"))
                    .andExpect(jsonPath("$.chatType").value("GROUP"));
        }

        @Test
        void getChatById_asNonMember_returnsForbidden() throws Exception {
            var outsider = authHelper.createUserAndToken("outsider2");

            mockMvc.perform(get("/api/chats/" + chatId)
                            .header("Authorization", outsider.bearerToken()))
                    .andExpect(status().isForbidden());
        }

        @Test
        void getChatById_withInvalidId_returnsError() throws Exception {
            mockMvc.perform(get("/api/chats/nonexistentid123")
                            .header("Authorization", admin.bearerToken()))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ----------------------------------------------------------------
    // GET CHAT MEMBERS
    // ----------------------------------------------------------------

    @Nested
    class GetChatMembers {
        @Test
        void getChatMembers_asMember_returnsMembers() throws Exception {
            mockMvc.perform(get("/api/chats/" + chatId + "/members")
                            .header("Authorization", member.bearerToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(2));
        }

        @Test
        void getChatMembers_asNonMember_returnsForbidden() throws Exception {
            var outsider = authHelper.createUserAndToken("outsider3");

            mockMvc.perform(get("/api/chats/" + chatId + "/members")
                            .header("Authorization", outsider.bearerToken()))
                    .andExpect(status().isForbidden());
        }
    }

    // ----------------------------------------------------------------
    // DELETE CHAT
    // ----------------------------------------------------------------

    @Nested
    class DeleteChat {
        @Test
        void deleteChat_byAdmin_deletesChat() throws Exception {
            mockMvc.perform(delete("/api/chats/" + chatId)
                            .header("Authorization", admin.bearerToken()))
                    .andExpect(status().isNoContent());

            assertThat(chatRepository.findById(chatId)).isEmpty();
            assertThat(chatMemberRepository.findByChatId(chatId)).isEmpty();
        }

        @Test
        void deleteChat_byMember_returnsForbidden() throws Exception {
            mockMvc.perform(delete("/api/chats/" + chatId)
                            .header("Authorization", member.bearerToken()))
                    .andExpect(status().isForbidden());

            assertThat(chatRepository.findById(chatId)).isPresent();
        }

        @Test
        void deleteChat_alsoClearsMessages() throws Exception {
            messageRepository.save(Message.builder()
                    .chatId(chatId)
                    .senderId(admin.user().getId())
                    .content("Message to be deleted")
                    .type(MessageType.TEXT)
                    .createdAt(Instant.now())
                    .deleted(false)
                    .build());

            mockMvc.perform(delete("/api/chats/" + chatId)
                            .header("Authorization", admin.bearerToken()))
                    .andExpect(status().isNoContent());

            assertThat(messageRepository.findByChatId(chatId)).isEmpty();
        }
    }

    // ----------------------------------------------------------------
    // UPDATE CHAT
    // ----------------------------------------------------------------
    
    @Nested
    class UpdateChat {
        @Test
        void updateChat_byAdmin_updatesChatName() throws Exception {
            MockMultipartFile data = new MockMultipartFile(
                    "data",
                    "",
                    MediaType.APPLICATION_JSON_VALUE,
                    """
                    {
                      "chatName": "Updated Name"
                    }
                    """.getBytes()
            );

            mockMvc.perform(multipart("/api/chats/" + chatId)
                            .file(data)
                            .header("Authorization", admin.bearerToken())
                            .with(request -> {
                                request.setMethod("PATCH");
                                return request;
                            }))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.chatName").value("Updated Name"));

            Chat updated = chatRepository.findById(chatId).orElseThrow();
            assertThat(updated.getChatName()).isEqualTo("Updated Name");
        }

        @Test
        void updateChat_byMember_returnsForbidden() throws Exception {
            mockMvc.perform(multipart("/api/chats/" + chatId)
                            .param("data", "{\"chatName\": \"Hacked Name\"}")
                            .header("Authorization", member.bearerToken())
                            .with(request -> { request.setMethod("PATCH"); return request; })
                            .contentType("multipart/form-data"))
                    .andExpect(status().isForbidden());
        }
    }

}