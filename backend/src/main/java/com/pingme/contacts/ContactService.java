package com.pingme.contacts;

import com.pingme.contacts.dto.ContactDTO;
import com.pingme.contacts.dto.ContactResponse;
import com.pingme.exceptions.*;
import com.pingme.users.User;
import com.pingme.users.UserService;
import com.pingme.users.dto.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserService userService;

    public Contact getContact(UserProfile user, String contactId) {
        return contactRepository.findByIdAndUser(contactId, user.id())
                .orElseThrow(() -> new ResourceNotFound("Contact with ID: '" + contactId + "' doesn't belong to the current user"));
    }

    public ContactResponse createContactRequest(UserProfile user, ContactDTO data) {
        User target = userService.getUserByUsername(data.username());

        if (user.id().equals(target.getId())) {
            throw new ContactConflictException("You cannot add yourself as a contact");
        }

        Optional<Contact> c = contactRepository.findContactBetween(user.id(), target.getId());
        if(c.isPresent()) {
            ContactStatus contactStatus = c.get().getStatus();

            switch (contactStatus) {
                case ACCEPTED -> throw new ContactConflictException("Contact already exists");
                case PENDING -> throw new ContactConflictException("Contact request already pending");
                default -> throw new IllegalStateException("Unknown contact status: " + contactStatus);
            }
        }

        Contact contact = Contact.builder()
                .senderId(user.id())
                .receiverId(target.getId())
                .status(ContactStatus.PENDING)
                .build();

        Contact result = contactRepository.save(contact);
        return new ContactResponse(
                result.getId(),
                target.getId(),
                target.getDisplayName(),
                target.getUsername(),
                target.getAvatarUrl(),
                result.getStatus(),
                result.getCreatedAt()
        );
    }

    public void updateContactRequest(UserProfile user, String contactId, ContactStatus status) {
        if(status == ContactStatus.PENDING) {
            throw new BadRequestException("Contact status can't be 'PENDING'");
        }

        Contact contact = getContact(user, contactId);

        if(contact.getStatus() != ContactStatus.PENDING) {
            throw new ForbiddenException("This contact request is no longer pending");
        }


        String userId = user.id();

        boolean isReceiver = userId.equals(contact.getReceiverId());

        if (!isReceiver) {
            throw new ForbiddenException("Only receiver can act on pending requests");
        }

        if(status == ContactStatus.REJECTED) {
            contactRepository.delete(contact);
            return;
        }

        contact.setStatus(status);
        contactRepository.save(contact);
    }

    public void deleteContact(UserProfile user, String contactId) {
        Contact contact = getContact(user, contactId);
        contactRepository.delete(contact);
    }

    public List<ContactResponse> getContacts(UserProfile user, ContactStatus status, int page, int limit) {
        return contactRepository.findContactsWithUserInfo(user.id(), status, page*limit, limit);
    }

    public boolean existsAcceptedContactBetween(String user1, String user2) {
        Optional<Contact> contact = contactRepository.findContactBetween(user1, user2);
        return contact.filter(value -> value.getStatus() == ContactStatus.ACCEPTED).isPresent();
    }

    public List<String> getAcceptedContactIds(String userId) {
        return contactRepository.findAcceptedContacts(userId)
                .stream()
                .map(contact ->
                        contact.getSenderId().equals(userId)
                                ? contact.getReceiverId()
                                : contact.getSenderId()
                )
                .toList();
    }

    public List<Contact> getContactsBetween(String userId, Set<String> otherUsers) {
        return contactRepository.findContactsBetween(userId, otherUsers);
    }
}
