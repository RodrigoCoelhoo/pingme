package com.pingme.chats.members;

import com.pingme.chats.Chat;
import com.pingme.exceptions.ForbiddenException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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

    public List<ChatMember> getChatMembers(String chatId) {
        return chatMemberRepository.findByChatId(chatId);
    }

    public List<ChatMember> getChatMembers(String chatId, int page, int size) {
        int skip = page * size;
        return chatMemberRepository.findPagedMembers(chatId, skip, size);
    }

    public long getTotalMembers(String chatId) {
        return chatMemberRepository.countByChatId(chatId);
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

    public boolean exists(String chatId, String userId) {
        return chatMemberRepository.findByChatIdAndUserId(chatId, userId).isPresent();
    }

    public List<ChatMember> getOtherMembers(List<String> chatIds, String userId) {
        return chatMemberRepository.findByChatIdInAndUserIdNot(chatIds, userId);
    }

    public Optional<Chat> findPrivateChat(String user1, String user2) {
        return chatMemberRepository.findPrivateChat(user1, user2);
    }
}