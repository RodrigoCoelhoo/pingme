import api from '../api';
import type { PagedResponse } from '../api.types';
import type { ChatDTO, ChatMember, ChatPreview } from './chat.types';

class ChatService {
	async getMyChats(page: number, size: number, search: string): Promise<PagedResponse<ChatPreview>> {
		const params = new URLSearchParams({
			page: page.toString(),
			size: size.toString(),
			search: search
		});

		const response = await api.get<PagedResponse<ChatPreview>>(`/chats?${params.toString()}`);
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

	async getChatMembers(chatId: string, page: number, size: number, search: string): Promise<PagedResponse<ChatMember>> {
		const params = new URLSearchParams({
			page: page.toString(),
			size: size.toString(),
			search: search
		});

		const response = await api.get<PagedResponse<ChatMember>>(`/chats/${chatId}/members?${params.toString()}`);
		return response.data;
	}

	async deleteChat(chatId: string): Promise<void> {
		await api.delete<void>(`/chats/${chatId}`)
	}
}

export default new ChatService();