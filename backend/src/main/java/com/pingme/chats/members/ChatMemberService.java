package com.pingme.chats.members;

import com.pingme.exceptions.ForbiddenException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatMemberService {

    private final ChatMemberRepository chatMemberRepository;

    public ChatMember getChatMember(String chatId, String userId) {
        return chatMemberRepository.findByChatIdAndUserId(chatId, userId)
                .orElseThrow(() -> new ForbiddenException("User is not a member of this chat"));
    }

    public List<ChatMember> getUserChats(String userId) {
        return chatMemberRepository.findByUserIdAndActiveTrue(userId);
    }

    public void markAsRead(String chatId, String userId, String messageId) {
        ChatMember member = getChatMember(chatId, userId);
        member.setLastReadMessageId(messageId);

        chatMemberRepository.save(member);
    }

    // Batch
    /*public void addMemberToGroup(UserProfile user, String chatId, String userId) {
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
    }*/

    public void activateChat(ChatMember member) {
        if (!member.isActive()) {
            member.setActive(true);
            chatMemberRepository.save(member);
        }
    }

    public void activateChat(String chatId, String userId) {
        ChatMember member = getChatMember(chatId, userId);
        activateChat(member);
    }

    public void leaveChat(String chatId, String userId) {
        ChatMember member = getChatMember(chatId, userId);

        if(member.isActive()) {
            member.setActive(false);
            chatMemberRepository.save(member);
        }
    }

    public void saveAll(List<ChatMember> members) {
        chatMemberRepository.saveAll(members);
    }
}