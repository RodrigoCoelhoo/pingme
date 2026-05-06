package com.pingme.chats.dto;

import java.util.List;

public record ChatMembers(
        List<ChatMemberResponse> members,
        long totalMembers
) {}
