package com.pingme.chats.members;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pingme.chats.Chat;
import com.pingme.chats.ChatRepository;
import com.pingme.chats.ChatType;
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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ChatMemberIntegrationTests extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private ChatMemberRepository chatMemberRepository;
    @Autowired private ContactRepository contactRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private TestAuthHelper authHelper;
    @Autowired private ObjectMapper objectMapper;

    private TestAuthHelper.AuthResult admin;
    private TestAuthHelper.AuthResult moderator;
    private TestAuthHelper.AuthResult member;
    private String chatId;

    @BeforeEach
    void setup() {
        messageRepository.deleteAll();
        chatMemberRepository.deleteAll();
        chatRepository.deleteAll();
        contactRepository.deleteAll();
        userRepository.deleteAll();

        admin = authHelper.createUserAndToken("admin");
        moderator = authHelper.createUserAndToken("mod");
        member = authHelper.createUserAndToken("member");

        Chat chat = chatRepository.save(Chat.builder()
                .chatType(ChatType.GROUP)
                .chatName("Test Group")
                .imageUrl("")
                .build());

        chatId = chat.getId();

        chatMemberRepository.save(ChatMember.builder()
                .chatId(chatId).userId(admin.user().getId())
                .role(ChatRole.ADMIN).active(true).muted(false).build());

        chatMemberRepository.save(ChatMember.builder()
                .chatId(chatId).userId(moderator.user().getId())
                .role(ChatRole.MODERATOR).active(true).muted(false).build());

        chatMemberRepository.save(ChatMember.builder()
                .chatId(chatId).userId(member.user().getId())
                .role(ChatRole.MEMBER).active(true).muted(false).build());
    }

    // ----------------------------------------------------------------
    // LEAVE CHAT
    // ----------------------------------------------------------------

    @Nested
    class LeaveChat {
        @Test
        void leaveChat_byMember_deactivatesMembership() throws Exception {
            mockMvc.perform(post("/api/chat-members/" + chatId + "/leave")
                            .header("Authorization", member.bearerToken()))
                    .andExpect(status().isNoContent());

            ChatMember updated = chatMemberRepository
                    .findByChatIdAndUserId(chatId, member.user().getId()).orElseThrow();
            assertThat(updated.isActive()).isFalse();
        }

        @Test
        void leaveChat_byAdmin_returnsForbidden() throws Exception {
            mockMvc.perform(post("/api/chat-members/" + chatId + "/leave")
                            .header("Authorization", admin.bearerToken()))
                    .andExpect(status().isForbidden());

            ChatMember adminMember = chatMemberRepository
                    .findByChatIdAndUserId(chatId, admin.user().getId()).orElseThrow();
            assertThat(adminMember.isActive()).isTrue();
        }
    }

    // ----------------------------------------------------------------
    // KICK MEMBER
    // ----------------------------------------------------------------

    @Nested
    class KickMember {
        @Test
        void kickMember_byAdmin_deactivatesMember() throws Exception {
            mockMvc.perform(post("/api/chat-members/" + chatId + "/kick/" + member.user().getId())
                            .header("Authorization", admin.bearerToken()))
                    .andExpect(status().isNoContent());

            ChatMember kicked = chatMemberRepository
                    .findByChatIdAndUserId(chatId, member.user().getId()).orElseThrow();
            assertThat(kicked.isActive()).isFalse();
        }

        @Test
        void kickMember_byModerator_kicksMember() throws Exception {
            mockMvc.perform(post("/api/chat-members/" + chatId + "/kick/" + member.user().getId())
                            .header("Authorization", moderator.bearerToken()))
                    .andExpect(status().isNoContent());

            ChatMember kicked = chatMemberRepository
                    .findByChatIdAndUserId(chatId, member.user().getId()).orElseThrow();
            assertThat(kicked.isActive()).isFalse();
        }

        @Test
        void kickMember_byMember_returnsForbidden() throws Exception {
            var anotherMember = authHelper.createUserAndToken("member2");
            chatMemberRepository.save(ChatMember.builder()
                    .chatId(chatId).userId(anotherMember.user().getId())
                    .role(ChatRole.MEMBER).active(true).muted(false).build());

            mockMvc.perform(post("/api/chat-members/" + chatId + "/kick/" + anotherMember.user().getId())
                            .header("Authorization", member.bearerToken()))
                    .andExpect(status().isForbidden());
        }

        @Test
        void kickMember_kickAdmin_returnsForbidden() throws Exception {
            mockMvc.perform(post("/api/chat-members/" + chatId + "/kick/" + admin.user().getId())
                            .header("Authorization", moderator.bearerToken()))
                    .andExpect(status().isForbidden());
        }

        @Test
        void kickMember_moderatorKicksAnotherModerator_returnsForbidden() throws Exception {
            var anotherMod = authHelper.createUserAndToken("mod2");
            chatMemberRepository.save(ChatMember.builder()
                    .chatId(chatId).userId(anotherMod.user().getId())
                    .role(ChatRole.MODERATOR).active(true).muted(false).build());

            mockMvc.perform(post("/api/chat-members/" + chatId + "/kick/" + anotherMod.user().getId())
                            .header("Authorization", moderator.bearerToken()))
                    .andExpect(status().isForbidden());
        }

        @Test
        void kickMember_kickSelf_returnsForbidden() throws Exception {
            mockMvc.perform(post("/api/chat-members/" + chatId + "/kick/" + admin.user().getId())
                            .header("Authorization", admin.bearerToken()))
                    .andExpect(status().isForbidden());
        }
    }

    // ----------------------------------------------------------------
    // UPDATE ROLE
    // ----------------------------------------------------------------

    @Nested
    class UpdateRole {
        @Test
        void updateRole_adminPromotesToModerator_updatesRole() throws Exception {
            var body = Map.of("userId", member.user().getId(), "role", "MODERATOR");

            mockMvc.perform(patch("/api/chat-members/" + chatId + "/update-role")
                            .header("Authorization", admin.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isNoContent());

            ChatMember updated = chatMemberRepository
                    .findByChatIdAndUserId(chatId, member.user().getId()).orElseThrow();
            assertThat(updated.getRole()).isEqualTo(ChatRole.MODERATOR);
        }

        @Test
        void updateRole_adminTransfersOwnership_adminBecomesModeratorAndTargetBecomesAdmin() throws Exception {
            var body = Map.of("userId", member.user().getId(), "role", "ADMIN");

            mockMvc.perform(patch("/api/chat-members/" + chatId + "/update-role")
                            .header("Authorization", admin.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isNoContent());

            ChatMember newAdmin = chatMemberRepository
                    .findByChatIdAndUserId(chatId, member.user().getId()).orElseThrow();
            assertThat(newAdmin.getRole()).isEqualTo(ChatRole.ADMIN);

            ChatMember oldAdmin = chatMemberRepository
                    .findByChatIdAndUserId(chatId, admin.user().getId()).orElseThrow();
            assertThat(oldAdmin.getRole()).isEqualTo(ChatRole.MODERATOR);
        }

        @Test
        void updateRole_byMember_returnsForbidden() throws Exception {
            var body = Map.of("userId", moderator.user().getId(), "role", "MEMBER");

            mockMvc.perform(patch("/api/chat-members/" + chatId + "/update-role")
                            .header("Authorization", member.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void updateRole_selfUpdate_returnsForbidden() throws Exception {
            var body = Map.of("userId", admin.user().getId(), "role", "MEMBER");

            mockMvc.perform(patch("/api/chat-members/" + chatId + "/update-role")
                            .header("Authorization", admin.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isForbidden());
        }
    }

    // ----------------------------------------------------------------
    // MUTE
    // ----------------------------------------------------------------

    @Nested
    class ToggleMute {
        @Test
        void muteChat_togglesMuteState() throws Exception {
            mockMvc.perform(patch("/api/chat-members/" + chatId + "/mute")
                            .header("Authorization", member.bearerToken()))
                    .andExpect(status().isNoContent());

            ChatMember muted = chatMemberRepository
                    .findByChatIdAndUserId(chatId, member.user().getId()).orElseThrow();
            assertThat(muted.isMuted()).isTrue();

            mockMvc.perform(patch("/api/chat-members/" + chatId + "/mute")
                            .header("Authorization", member.bearerToken()))
                    .andExpect(status().isNoContent());

            ChatMember unmuted = chatMemberRepository
                    .findByChatIdAndUserId(chatId, member.user().getId()).orElseThrow();
            assertThat(unmuted.isMuted()).isFalse();
        }
    }

    // ----------------------------------------------------------------
    // ADD MEMBERS
    // ----------------------------------------------------------------

    @Nested
    class AddMembers {
        @Test
        void addMembers_byAdmin_withAcceptedContact_addsMember() throws Exception {
            var newUser = authHelper.createUserAndToken("newuser");

            contactRepository.save(Contact.builder()
                    .senderId(admin.user().getId())
                    .receiverId(newUser.user().getId())
                    .status(ContactStatus.ACCEPTED)
                    .build());

            var body = Map.of("memberIds", java.util.List.of(newUser.user().getId()));

            mockMvc.perform(post("/api/chat-members/" + chatId + "/add-members")
                            .header("Authorization", admin.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isNoContent());

            assertThat(chatMemberRepository.findByChatIdAndUserId(chatId, newUser.user().getId()))
                    .isPresent();
        }

        @Test
        void addMembers_byMember_returnsForbidden() throws Exception {
            var newUser = authHelper.createUserAndToken("newuser2");
            var body = Map.of("memberIds", java.util.List.of(newUser.user().getId()));

            mockMvc.perform(post("/api/chat-members/" + chatId + "/add-members")
                            .header("Authorization", member.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isForbidden());
        }
    }
}