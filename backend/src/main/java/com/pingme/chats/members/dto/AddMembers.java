package com.pingme.chats.members.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AddMembers(
        @NotEmpty(message = "MemberIds can't be empty")
        List<String> memberIds
) {}