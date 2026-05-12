import api from '../api';
import type { Message, SendMessageDTO } from './message.types';

class MessageService {
	async getChatMessages(chatId: string, page: number = 0, limit: number = 50): Promise<Message[]> {
		const response = await api.get<Message[]>(`/chats/${chatId}/messages`, {
			params: { page, limit }
		});
		return response.data;
	}

	async sendMessage(chatId: string, dto: SendMessageDTO): Promise<Message> {
		const response = await api.post<Message>(`/chats/${chatId}/messages`, dto);
		return response.data;
	}

	async markAsRead(chatId: string, messageId: string): Promise<void> {
		await api.put(`/chats/${chatId}/messages/${messageId}/read`);
	}
}

export default new MessageService();