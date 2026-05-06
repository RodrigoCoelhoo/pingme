import type { ContactStatus } from "../contact/contact.types";

export interface ChatPreview {
	chatId: string;
	chatType: ChatType;
	chatName: string;
	chatImageUrl: string;
	lastMessage: string;
	lastMessageTimestamp: string;
	role: MemberRole;
	isMuted: boolean;
	unreadCount: number;
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

export interface ChatMembers {
	members: ChatMember[];
	totalMembers: number;
}

export interface ChatMember {
	memberId: string;
	displayName: string;
	username: string;
	avatarUrl: string;
	role: MemberRole;
	status: ContactStatus;
}