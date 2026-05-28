import type { ContactStatus } from "../contact/contact.types";

export interface ChatPreview {
	chatId: string;
	chatType: ChatType;
	chatName: string;
	chatImageUrl: string;
	lastMessageId: string;
	lastMessage: string;
	lastMessageTimestamp: string;
	lastMessageDeleted: boolean | null;
	role: MemberRole;
	muted: boolean;
	unreadCount: number;
	otherUserId?: string; // Only for private chats
	otherUserLastSeenAt?: string | null; // Only for private chats
}

export interface ChatDTO {
	membersIds: string[];
	chatName?: string;
}

export enum ChatType {
	PRIVATE = 'PRIVATE',
	GROUP = 'GROUP'
}

export enum MemberRole {
	ADMIN = 'ADMIN',
	MODERATOR = 'MODERATOR',
	MEMBER = 'MEMBER'
}

export interface ChatMember {
	memberId: string;
	displayName: string;
	username: string;
	avatarUrl: string;
	role: MemberRole;
	status: ContactStatus;
}

export interface ChatEvent {
	type: ChatEventType;
	chatId: string;
	payload: any;
}

export enum ChatEventType {
	MEMBER_KICKED = 'MEMBER_KICKED',
    MEMBER_ROLE_UPDATED = 'MEMBER_ROLE_UPDATED',
    MEMBER_ADDED = 'MEMBER_ADDED',
	DETAILS_UPDATED = 'DETAILS_UPDATED',
	MESSAGE_EDITED = "MESSAGE_EDITED",
	MESSAGE_DELETED = "MESSAGE_DELETED",
}

export interface UpdateChatRequest {
	chatName?: string;
}