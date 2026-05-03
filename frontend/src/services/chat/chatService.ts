import api from '../api';
import type { ChatDTO, ChatPreview } from './chatTypes';

class ChatService {
	async getMyChats(): Promise<ChatPreview[]> {
		const response = await api.get<ChatPreview[]>('/chats');
		return response.data;
	}

	async getOrCreatePrivateChat(targetId: string): Promise<ChatPreview> {
		const response = await api.post<ChatPreview>(`/chats/private/${targetId}`);
		return response.data;
	}

	async createGroupChat(dto: ChatDTO): Promise<any> {
		const response = await api.post('/chats/group', dto);
		return response.data;
	}
}

export default new ChatService();