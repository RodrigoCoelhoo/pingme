package com.pingme.chats.members;

import com.pingme.chats.Chat;
import com.pingme.chats.ChatService;
import com.pingme.chats.ChatType;
import com.pingme.exceptions.BadRequestException;
import com.pingme.exceptions.ForbiddenException;
import com.pingme.users.dto.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatMemberService {

    private final ChatMemberRepository chatMemberRepository;
    private final ChatService chatService;

    private ChatMember getChatMember(String chatId, String userId) {
        return chatMemberRepository.findByChatIdAndUserId(chatId, userId)
                .orElseThrow(() -> new ForbiddenException("User is not a member of this chat"));
    }

    public void markAsRead(String chatId, String userId, String messageId) {
        ChatMember member = getChatMember(chatId, userId);
        member.setLastReadMessageId(messageId);

        chatMemberRepository.save(member);
    }

    public void activateChat(String chatId, String userId) {

        Chat chat = chatService.getChat(chatId, userId);

        if(chat.getChatType() == ChatType.GROUP) {
            throw new BadRequestException("Group chats don't support this function");
        }

        ChatMember member = getChatMember(chatId, userId);

        if (!member.isActive()) {
            member.setActive(true);
            chatMemberRepository.save(member);
        }
    }

    public void addMemberToGroup(UserProfile user, String chatId, String userId) {

        Chat chat = chatService.getChat(chatId, user.id());

        ChatMember member = chatMemberRepository
                .findByChatIdAndUserId(chatId, userId)
                .orElse(null);

        if (member != null) {
            member.setActive(true); // rejoin
        } else {
            member = ChatMember.builder()
                    .chatId(chatId)
                    .userId(userId)
                    .active(true)
                    .build();
        }

        chatMemberRepository.save(member);
    }

    public void leaveGroup(String chatId, String userId) {
        Chat chat = chatService.getChat(chatId, userId);
        ChatMember member = getChatMember(chatId, userId);

        if (chat.getChatType() != ChatType.GROUP) {
            throw new BadRequestException("Cannot leave a private chat");
        }

        member.setActive(false);
        chatMemberRepository.save(member);
    }
}