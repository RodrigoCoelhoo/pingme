export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface MessageResponse {
	messageId: string;
	chatId: string;
	senderId: string;
	senderDisplayName: string;
	senderAvatarUrl: string;
	content: string;
	type: MessageType;
	createdAt: string;
	editedAt: string | null;
	deleted: boolean;
}

export interface MessageRequest {
	content: string;
	type: MessageType;
}