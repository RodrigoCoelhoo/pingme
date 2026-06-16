package com.pingme.chats;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pingme.chats.members.ChatMember;
import com.pingme.chats.members.ChatMemberRepository;
import com.pingme.chats.members.ChatRole;
import com.pingme.config.BaseIntegrationTest;
import com.pingme.config.TestAuthHelper;
import com.pingme.contacts.Contact;
import com.pingme.contacts.ContactRepository;
import com.pingme.contacts.ContactStatus;
import com.pingme.messages.MessageRepository;
import com.pingme.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ChatCreationE2ETest extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private ChatMemberRepository chatMemberRepository;
    @Autowired private ContactRepository contactRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private TestAuthHelper authHelper;
    @Autowired private ObjectMapper objectMapper;

    private TestAuthHelper.AuthResult userA;
    private TestAuthHelper.AuthResult userB;
    private TestAuthHelper.AuthResult userC;

    @BeforeEach
    void setup() {
        messageRepository.deleteAll();
        chatMemberRepository.deleteAll();
        chatRepository.deleteAll();
        contactRepository.deleteAll();
        userRepository.deleteAll();

        userA = authHelper.createUserAndToken("e2eA");
        userB = authHelper.createUserAndToken("e2eB");
        userC = authHelper.createUserAndToken("e2eC");
    }

    // ----------------------------------------------------------------
    // HELPERS
    // ----------------------------------------------------------------

    private void createAcceptedContact(String senderId, String receiverId) {
        contactRepository.save(Contact.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .status(ContactStatus.ACCEPTED)
                .build());
    }

    // ----------------------------------------------------------------
    // PRIVATE CHAT
    // ----------------------------------------------------------------

    @Nested
    class CreatePrivateChat {
        @Test
        void createPrivateChat_withAcceptedContact_returnsChat() throws Exception {
            createAcceptedContact(userA.user().getId(), userB.user().getId());

            mockMvc.perform(post("/api/chats/private/" + userB.user().getId())
                            .header("Authorization", userA.bearerToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.chatType").value("PRIVATE"))
                    .andExpect(jsonPath("$.chatName").value(userB.user().getDisplayName()));

            assertThat(chatRepository.findAll()).hasSize(1);
            assertThat(chatMemberRepository.findAll()).hasSize(2);
        }

        @Test
        void createPrivateChat_calledTwice_returnsSameChat() throws Exception {
            createAcceptedContact(userA.user().getId(), userB.user().getId());

            mockMvc.perform(post("/api/chats/private/" + userB.user().getId())
                            .header("Authorization", userA.bearerToken()))
                    .andExpect(status().isOk());

            mockMvc.perform(post("/api/chats/private/" + userB.user().getId())
                            .header("Authorization", userA.bearerToken()))
                    .andExpect(status().isOk());

            assertThat(chatRepository.findAll()).hasSize(1);
        }

        @Test
        void createPrivateChat_withoutContact_returnsForbidden() throws Exception {
            mockMvc.perform(post("/api/chats/private/" + userB.user().getId())
                            .header("Authorization", userA.bearerToken()))
                    .andExpect(status().isForbidden());
        }

        @Test
        void createPrivateChat_withPendingContact_returnsForbidden() throws Exception {
            contactRepository.save(Contact.builder()
                    .senderId(userA.user().getId())
                    .receiverId(userB.user().getId())
                    .status(ContactStatus.PENDING)
                    .build());

            mockMvc.perform(post("/api/chats/private/" + userB.user().getId())
                            .header("Authorization", userA.bearerToken()))
                    .andExpect(status().isForbidden());
        }
    }

    // ----------------------------------------------------------------
    // GROUP CHAT
    // ----------------------------------------------------------------

    @Nested
    class CreateGroupChat {
        @Test
        void createGroupChat_withAllContacts_returnsChat() throws Exception {
            createAcceptedContact(userA.user().getId(), userB.user().getId());
            createAcceptedContact(userA.user().getId(), userC.user().getId());

            var body = Map.of(
                    "membersIds", List.of(userB.user().getId(), userC.user().getId()),
                    "chatName", "E2E Group"
            );

            mockMvc.perform(post("/api/chats/group")
                            .header("Authorization", userA.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.chatType").value("GROUP"))
                    .andExpect(jsonPath("$.chatName").value("E2E Group"))
                    .andExpect(jsonPath("$.role").value("ADMIN"));

            Chat created = chatRepository.findAll().getFirst();
            assertThat(created.getChatName()).isEqualTo("E2E Group");

            var members = chatMemberRepository.findByChatId(created.getId());
            assertThat(members).hasSize(3);

            var adminMember = members.stream()
                    .filter(m -> m.getUserId().equals(userA.user().getId()))
                    .findFirst().orElseThrow();
            assertThat(adminMember.getRole()).isEqualTo(ChatRole.ADMIN);
        }

        @Test
        void createGroupChat_withNonContact_returnsForbidden() throws Exception {
            createAcceptedContact(userA.user().getId(), userB.user().getId());

            var body = Map.of(
                    "membersIds", List.of(userB.user().getId(), userC.user().getId()),
                    "chatName", "Invalid Group"
            );

            mockMvc.perform(post("/api/chats/group")
                            .header("Authorization", userA.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isForbidden());

            assertThat(chatRepository.findAll()).isEmpty();
        }

        @Test
        void createGroupChat_creatorNotInMembersList_isAddedAutomatically() throws Exception {
            createAcceptedContact(userA.user().getId(), userB.user().getId());

            var body = Map.of(
                    "membersIds", List.of(userB.user().getId()),
                    "chatName", "Auto-add Group"
            );

            mockMvc.perform(post("/api/chats/group")
                            .header("Authorization", userA.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            Chat created = chatRepository.findAll().getFirst();
            var members = chatMemberRepository.findByChatId(created.getId());

            assertThat(members).hasSize(2);
            assertThat(members.stream().map(ChatMember::getUserId))
                    .contains(userA.user().getId(), userB.user().getId());
        }
    }
}