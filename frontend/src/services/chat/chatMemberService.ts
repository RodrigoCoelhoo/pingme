import api from '../api';

class ChatMemberService {
	async leaveChat(chatId: string): Promise<void> {
		await api.put<void>(`/chat-members/${chatId}/leave`);
	}
}

export default new ChatMemberService();