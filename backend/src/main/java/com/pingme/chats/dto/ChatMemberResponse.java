package com.pingme.chats.dto;

import com.pingme.chats.members.ChatMember;
import com.pingme.chats.members.ChatRole;
import com.pingme.contacts.ContactStatus;
import com.pingme.users.User;

public record ChatMemberResponse(
        String memberId,
        String displayName,
        String username,
        String avatarUrl,
        ChatRole role,
        ContactStatus status
) {
    public static ChatMemberResponse format(ChatMember member, User user, ContactStatus status) {
        return new ChatMemberResponse(
                member.getUserId(),
                user.getDisplayName(),
                user.getUsername(),
                user.getAvatarUrl(),
                member.getRole(),
                status
        );
    }
}
