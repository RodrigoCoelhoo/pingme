package com.pingme.chats.dto;

import com.pingme.chats.Chat;
import com.pingme.chats.ChatType;
import com.pingme.chats.members.ChatMember;
import com.pingme.messages.Message;
import com.pingme.users.User;

import java.time.Instant;
import java.time.LocalDateTime;

public record ChatContext(
        Chat chat,
        ChatMember member,
        User otherUser,
        Message lastMessage,
        Instant sortTime,
        int unreadCount
) {
    public ChatPreview toPreview(boolean online) {
        String chatName = chat.getChatName();
        String chatImageUrl = chat.getImageUrl();
        String otherUserId = null;
        Instant otherUserLastSeenAt = null;

        if(chat.getChatType() == ChatType.PRIVATE && otherUser != null) {
            chatName = otherUser.getDisplayName();
            chatImageUrl = otherUser.getAvatarUrl();
            otherUserId = otherUser.getId();
            if(!online) {
                otherUserLastSeenAt = otherUser.getLastSeenAt();
            }
        }

        String lastMessageContent = lastMessage != null
                ? lastMessage.getContent()
                : null;

        Instant lastMessageTimestamp = lastMessage != null
                ? lastMessage.getCreatedAt()
                : null;

        return new ChatPreview(
                chat.getId(),
                chat.getChatType(),
                chatName,
                chatImageUrl,
                lastMessageContent,
                lastMessageTimestamp,
                member.getRole(),
                member.isMuted(),
                unreadCount,
                otherUserId,
                otherUserLastSeenAt
        );
    }
}