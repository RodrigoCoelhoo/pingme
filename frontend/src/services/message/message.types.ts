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

    pending?: boolean;      
    failed?: boolean;       
    localId?: string;       // Temp ID for optimistic UI updates
}

export interface MessageRequest {
	content: string;
	type: MessageType;
}