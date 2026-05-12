import api from '../api';
import type { MemberRole } from './chat.types';

class ChatMemberService {
	async leaveChat(chatId: string): Promise<void> {
		await api.post<void>(`/chat-members/${chatId}/leave`);
	}

	async muteChat(chatId: string): Promise<void> {
		await api.patch<void>(`/chat-members/${chatId}/mute`);
	}

	async updateRole(chatId: string, data: { userId: string; role: MemberRole }): Promise<void> {
		await api.patch<void>(`/chat-members/${chatId}/update-role`, data);
	}

	async kickMember(chatId: string, userId: string): Promise<void> {
		await api.post<void>(`/chat-members/${chatId}/kick/${userId}`);
	}

	async addMembers(chatId: string, data: { memberIds: string[] }): Promise<void> {
		await api.post<void>(`/chat-members/${chatId}/add-members`, data);
	}

	async transferOwnership(chatId: string, userId: string): Promise<void> {
		await api.post<void>(`/chat-members/${chatId}/transfer-ownership/${userId}`);
	}
}

export default new ChatMemberService();