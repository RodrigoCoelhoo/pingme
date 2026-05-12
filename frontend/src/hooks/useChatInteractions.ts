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
}: UseChatInteractionsProps) {

	// Auto-close sidebar when chat is selected on mobile
	useEffect(() => {
		if (activeChat && isMobile) {
			setIsSidebarOpen(false);
		}
	}, [activeChat, isMobile, setIsSidebarOpen]);

	// Auto-open sidebar when no chat is selected on mobile
	useEffect(() => {
		if (!activeChat && isMobile) {
			setIsSidebarOpen(true);
		}
	}, [activeChat, isMobile, setIsSidebarOpen]);

	const handleActiveChatChange = (chat: ChatPreview) => {
		setActiveChat(chat);
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