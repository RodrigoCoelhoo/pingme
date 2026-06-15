package com.pingme.contacts;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pingme.config.BaseIntegrationTest;
import com.pingme.config.TestAuthHelper;
import com.pingme.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ContactIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private TestAuthHelper authHelper;

    @Autowired
    private ObjectMapper objectMapper;

    private TestAuthHelper.AuthResult sender;
    private TestAuthHelper.AuthResult receiver;

    @BeforeEach
    void setup() {
        contactRepository.deleteAll();
        userRepository.deleteAll();

        sender = authHelper.createUserAndToken("sender");
        receiver = authHelper.createUserAndToken("receiver");
    }

    // ----------------------------------------------------------------
    // CREATE CONTACT REQUEST
    // ----------------------------------------------------------------

    @Nested
    class CreateContactRequest {
        @Test
        void createContactRequest_withValidTarget_returnsContactResponse() throws Exception {
            var body = Map.of("username", "testuser_receiver");

            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.contactStatus").value("PENDING"))
                    .andExpect(jsonPath("$.username").value("testuser_receiver"));
        }

        @Test
        void createContactRequest_persistsInMongoDB() throws Exception {
            var body = Map.of("username", "testuser_receiver");

            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            assertThat(contactRepository.findContactBetween(
                    sender.user().getId(),
                    receiver.user().getId()
            )).isPresent();
        }

        @Test
        void createContactRequest_toSelf_returnsConflict() throws Exception {
            var body = Map.of("username", "testuser_sender");

            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isConflict());
        }

        @Test
        void createContactRequest_duplicate_returnsConflict() throws Exception {
            var body = Map.of("username", "testuser_receiver");

            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isConflict());
        }

        @Test
        void createContactRequest_toNonExistentUser_returnsNotFound() throws Exception {
            var body = Map.of("username", "ghost_user");

            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isNotFound());
        }
    }

    // ----------------------------------------------------------------
    // GET CONTACTS
    // ----------------------------------------------------------------

    @Nested
    class GetContacts {
        @Test
        void getContacts_withNoContacts_returnsEmptyList() throws Exception {
            mockMvc.perform(get("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .param("status", "ACCEPTED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content.length()").value(0));
        }

        @Test
        void getContacts_pendingReceived_returnsCorrectContacts() throws Exception {
            // sender envia pedido ao receiver
            var body = Map.of("username", "testuser_receiver");
            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            // receiver deve ver o pedido como RECEIVED
            mockMvc.perform(get("/api/contacts")
                            .header("Authorization", receiver.bearerToken())
                            .param("status", "PENDING")
                            .param("pendingType", "RECEIVED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1));
        }
    }

    // ----------------------------------------------------------------
    // ACCEPT / REJECT / CANCEL
    // ----------------------------------------------------------------

    @Nested
    class UpdateContactRequest {
        @Test
        void acceptContactRequest_byReceiver_updatesStatusToAccepted() throws Exception {
            var body = Map.of("username", "testuser_receiver");
            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            String contactId = contactRepository
                    .findContactBetween(sender.user().getId(), receiver.user().getId())
                    .orElseThrow().getId();

            mockMvc.perform(put("/api/contacts/" + contactId)
                            .header("Authorization", receiver.bearerToken())
                            .param("action", "ACCEPT"))
                    .andExpect(status().isNoContent());

            Contact updated = contactRepository.findById(contactId).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(ContactStatus.ACCEPTED);
        }

        @Test
        void acceptContactRequest_bySender_returnsForbidden() throws Exception {
            var body = Map.of("username", "testuser_receiver");
            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            String contactId = contactRepository
                    .findContactBetween(sender.user().getId(), receiver.user().getId())
                    .orElseThrow().getId();

            mockMvc.perform(put("/api/contacts/" + contactId)
                            .header("Authorization", sender.bearerToken())
                            .param("action", "ACCEPT"))
                    .andExpect(status().isForbidden());
        }

        @Test
        void rejectContactRequest_byReceiver_deletesContact() throws Exception {
            var body = Map.of("username", "testuser_receiver");
            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            String contactId = contactRepository
                    .findContactBetween(sender.user().getId(), receiver.user().getId())
                    .orElseThrow().getId();

            mockMvc.perform(put("/api/contacts/" + contactId)
                            .header("Authorization", receiver.bearerToken())
                            .param("action", "REJECT"))
                    .andExpect(status().isNoContent());

            assertThat(contactRepository.findById(contactId)).isEmpty();
        }

        @Test
        void rejectContactRequest_bySender_returnsForbidden() throws Exception {
            var body = Map.of("username", "testuser_receiver");
            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            String contactId = contactRepository
                    .findContactBetween(sender.user().getId(), receiver.user().getId())
                    .orElseThrow().getId();

            mockMvc.perform(put("/api/contacts/" + contactId)
                            .header("Authorization", sender.bearerToken())
                            .param("action", "REJECT"))
                    .andExpect(status().isForbidden());

            assertThat(contactRepository.findById(contactId)).isPresent();
        }

        @Test
        void cancelContactRequest_bySender_deletesContact() throws Exception {
            var body = Map.of("username", "testuser_receiver");
            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            String contactId = contactRepository
                    .findContactBetween(sender.user().getId(), receiver.user().getId())
                    .orElseThrow().getId();

            mockMvc.perform(put("/api/contacts/" + contactId)
                            .header("Authorization", sender.bearerToken())
                            .param("action", "CANCEL"))
                    .andExpect(status().isNoContent());

            assertThat(contactRepository.findById(contactId)).isEmpty();
        }

        @Test
        void cancelContactRequest_byReceiver_returnsForbidden() throws Exception {
            var body = Map.of("username", "testuser_receiver");
            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            String contactId = contactRepository
                    .findContactBetween(sender.user().getId(), receiver.user().getId())
                    .orElseThrow().getId();

            mockMvc.perform(put("/api/contacts/" + contactId)
                            .header("Authorization", receiver.bearerToken())
                            .param("action", "CANCEL"))
                    .andExpect(status().isForbidden());

            assertThat(contactRepository.findById(contactId)).isPresent();
        }
    }

    // ----------------------------------------------------------------
    // DELETE CONTACT
    // ----------------------------------------------------------------

    @Nested
    class DeleteContact {
        @Test
        void deleteContact_byEitherUser_removesContact() throws Exception {
            // Cria e aceita contacto
            var body = Map.of("username", "testuser_receiver");
            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            String contactId = contactRepository
                    .findContactBetween(sender.user().getId(), receiver.user().getId())
                    .orElseThrow().getId();

            mockMvc.perform(put("/api/contacts/" + contactId)
                            .header("Authorization", receiver.bearerToken())
                            .param("action", "ACCEPT"))
                    .andExpect(status().isNoContent());

            // Sender apaga o contacto
            mockMvc.perform(delete("/api/contacts/" + contactId)
                            .header("Authorization", sender.bearerToken()))
                    .andExpect(status().isNoContent());

            assertThat(contactRepository.findById(contactId)).isEmpty();
        }

        @Test
        void deleteContact_byUnrelatedUser_returnsNotFound() throws Exception {
            var thirdUser = authHelper.createUserAndToken("third");

            var body = Map.of("username", "testuser_receiver");
            mockMvc.perform(post("/api/contacts")
                            .header("Authorization", sender.bearerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());

            String contactId = contactRepository
                    .findContactBetween(sender.user().getId(), receiver.user().getId())
                    .orElseThrow().getId();

            // Terceiro utilizador tenta apagar contacto alheio
            mockMvc.perform(delete("/api/contacts/" + contactId)
                            .header("Authorization", thirdUser.bearerToken()))
                    .andExpect(status().isNotFound());
        }
    }
}