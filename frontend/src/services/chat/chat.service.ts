import api from '../api';
import type { ChatDTO, ChatMembers, ChatPreview } from './chat.types';

class ChatService {
	async getMyChats(): Promise<ChatPreview[]> {
		const response = await api.get<ChatPreview[]>('/chats');
		return response.data;
	}

	async getOrCreatePrivateChat(targetId: string): Promise<ChatPreview> {
		const response = await api.post<ChatPreview>(`/chats/private/${targetId}`);
		return response.data;
	}

	async createGroupChat(dto: ChatDTO): Promise<ChatPreview> {
		const response = await api.post<ChatPreview>('/chats/group', dto);
		return response.data;
	}

	async getChatMembers(chatId: string, page: number, size: number): Promise<ChatMembers> {
		const params = new URLSearchParams({
			page: page.toString(),
			size: size.toString(),
		});

		const response = await api.get<ChatMembers>(`/chats/${chatId}/members?${params.toString()}`);
		return response.data;
	}
}

export default new ChatService();