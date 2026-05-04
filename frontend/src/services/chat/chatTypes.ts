import type { MemberRole } from "../../components/chat/ChatDetailsModal";

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