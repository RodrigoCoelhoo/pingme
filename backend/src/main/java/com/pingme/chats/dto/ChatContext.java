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
        Instant sortTime,
        int unreadCount
) {
    public ChatPreview toPreview() {
        String chatName = chat.getChatType() == ChatType.PRIVATE && otherUser != null
                ? otherUser.getDisplayName()
                : chat.getChatName();

        String chatImageUrl = chat.getChatType() == ChatType.PRIVATE && otherUser != null
                ? otherUser.getAvatarUrl()
                : chat.getImageUrl();

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
                unreadCount
        );
    }
}