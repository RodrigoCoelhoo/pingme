import api from '../api';
import type { PagedResponse } from '../api.types';
import type { ChatDTO, ChatMember, ChatPreview, UpdateChatRequest } from './chat.types';

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

	async getChatById(chatId: string): Promise<ChatPreview> {
		const response = await api.get<ChatPreview>(`/chats/${chatId}`);
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

	async updateChat(chatId: string, data?: UpdateChatRequest, file?: File): Promise<ChatPreview> {
		const formData = new FormData();

		if (data) {
			formData.append(
				'data',
				new Blob(
					[JSON.stringify(data)],
					{
						type: 'application/json'
					}
				)
			);
		}

		if (file) {
			formData.append('file', file);
		}

		const response = await api.patch<ChatPreview>(
			`/chats/${chatId}`,
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			}
		);

		return response.data;
	};
}

export default new ChatService();