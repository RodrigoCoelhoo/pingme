import { useEffect } from 'react';
import type { ChatPreview } from '../services/chat/chat.types';

interface UseChatInteractionsProps {
	activeChat: ChatPreview | null;
	isMobile: boolean;
	setActiveChat: (chat: ChatPreview) => void;
	setIsSidebarOpen: (open: boolean) => void;
	setActiveTab: (tab: 'chats' | 'contacts') => void;
	handleCreatePrivateChat: (userId: string) => Promise<ChatPreview>;
	handleCreateGroupChat: (memberIds: string[], groupName?: string) => Promise<ChatPreview>;
	insertChatSorted: (chat: ChatPreview) => void;
	updateChat: (chatId: string, updates: Partial<ChatPreview>) => void;
}

export function useChatInteractions({
	activeChat,
	isMobile,
	setActiveChat,
	setIsSidebarOpen,
	setActiveTab,
	handleCreatePrivateChat,
	handleCreateGroupChat,
	insertChatSorted,
	updateChat,
}: UseChatInteractionsProps) {

	useEffect(() => {
		if (activeChat && isMobile) {
			setIsSidebarOpen(false);
		}
	}, [activeChat, isMobile, setIsSidebarOpen]);

	useEffect(() => {
		if (!activeChat && isMobile) {
			setIsSidebarOpen(true);
		}
	}, [activeChat, isMobile, setIsSidebarOpen]);

	const handleActiveChatChange = (chat: ChatPreview) => {
		setActiveChat(chat);
		updateChat(chat.chatId, { unreadCount: 0 });
		if (isMobile) {
			setIsSidebarOpen(false);
		}
	};

	const handleCreatePrivateChatWithUI = async (userId: string) => {
		try {
			const chat = await handleCreatePrivateChat(userId);
			insertChatSorted(chat);
			setActiveTab('chats');
			if (isMobile) {
				setIsSidebarOpen(false);
			}
		} catch (error) {
			// Error already handled in hook
		}
	};

	const handleCreateGroupChatWithUI = async (memberIds: string[], groupName?: string) => {
		try {
			const chat = await handleCreateGroupChat(memberIds, groupName);
			insertChatSorted(chat);
			setActiveTab('chats');
			if (isMobile) {
				setIsSidebarOpen(false);
			}
		} catch (error) {
			// Error already handled in hook
		}
	};

	return {
		handleActiveChatChange,
		handleCreatePrivateChatWithUI,
		handleCreateGroupChatWithUI,
	};
}