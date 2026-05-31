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

export interface UpdateChatRequest {
	chatName?: string;
}