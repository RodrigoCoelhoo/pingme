package com.pingme.chats.dto;

import com.pingme.chats.Chat;
import com.pingme.chats.ChatType;
import com.pingme.chats.members.ChatMember;
import com.pingme.messages.Message;
import com.pingme.users.User;

import java.time.Instant;

public record ChatContext(
        Chat chat,
        ChatMember member,
        User otherUser,
        Message lastMessage,
        Instant sortTime
) {
    public static ChatPreview toPreview(ChatContext ctx) {
        Chat chat = ctx.chat();
        ChatMember member = ctx.member();
        User other = ctx.otherUser();
        Message msg = ctx.lastMessage();

        String name = chat.getChatName();
        String image = chat.getImageUrl();

        if (chat.getChatType() == ChatType.PRIVATE && other != null) {
            name = other.getDisplayName();
            image = other.getAvatarUrl();
        }

        return new ChatPreview(
                chat.getId(),
                chat.getChatType(),
                name,
                image,
                msg != null ? msg.getContent() : null,
                msg != null ? msg.getCreatedAt() : null,
                member != null ? member.getRole() : null,
                member != null && member.isMuted(),
                0
        );
    }
}