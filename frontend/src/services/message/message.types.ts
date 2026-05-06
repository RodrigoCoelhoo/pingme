export interface Message {
	messageId: string;
	chatId: string;
	senderId: string;
	senderName: string;
	senderAvatar?: string;
	content: string;
	timestamp: string;
	isRead: boolean;
}

export interface SendMessageDTO {
	content: string;
}