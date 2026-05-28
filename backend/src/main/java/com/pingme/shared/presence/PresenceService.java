package com.pingme.shared.presence;

import com.pingme.contacts.ContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PresenceService {

    private final PresenceTracker presenceTracker;
    private final ContactService contactService;

    public Set<String> getOnlineUsers(String userId) {
        List<String> allContacts = contactService.getAcceptedContactIds(userId);
        return presenceTracker.filterOnline(new HashSet<>(allContacts));
    }

}
