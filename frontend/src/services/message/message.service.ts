import api from '../api'; // Your axios instance
import type { PagedResponse } from '../api.types';
import type { MessageRequest, MessageResponse } from './message.types';

class MessageService {
	async getChatMessages(chatId: string, page: number = 0, size: number = 50): Promise<PagedResponse<MessageResponse>> {
		const response = await api.get<PagedResponse<MessageResponse>>(`/chats/${chatId}/messages`, {
			params: { page, size }
		});
		return response.data;
	}

	async sendMessage(chatId: string, request: MessageRequest): Promise<MessageResponse> {
		const response = await api.post<MessageResponse>(`/chats/${chatId}/messages`, {
			content: request.content,
			type: request.type || 'TEXT'
		});
		return response.data;
	}

	async markAsRead(chatId: string, lastMessageId: string): Promise<void> {
		await api.patch(`/chats/${chatId}/messages/read`, null, {
			params: { lastMessageId }
		});
	}

	async editMessage(chatId: string, messageId: string, request: MessageRequest): Promise<MessageResponse> {
		const response = await api.patch<MessageResponse>(`/chats/${chatId}/messages/${messageId}`, request);
		return response.data;
	}

	async deleteMessage(chatId: string, messageId: string): Promise<void> {
		await api.delete(`/chats/${chatId}/messages/${messageId}`);
	}

	async sendFileMessages(chatId: string, files: File[]): Promise<MessageResponse[]> {
		const formData = new FormData();
		files.forEach(file => formData.append('files', file));

		const response = await api.post<MessageResponse[]>(
			`/chats/${chatId}/messages/files`,
			formData,
			{ headers: { 'Content-Type': 'multipart/form-data' } }
		);
		return response.data;
	}
}

export default new MessageService();