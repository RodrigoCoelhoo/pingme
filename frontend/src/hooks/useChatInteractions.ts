import { useEffect } from 'react';

interface UseChatInteractionsProps {
	activeChat: string | null;
	isMobile: boolean;
	isSidebarOpen: boolean;
	setActiveChat: (chatId: string) => void;
	setIsSidebarOpen: (open: boolean) => void;
	setActiveTab: (tab: 'chats' | 'contacts') => void;
	handleCreatePrivateChat: (userId: string) => Promise<string>;
	handleCreateGroupChat: (memberIds: string[], groupName?: string) => Promise<string>;
}

export function useChatInteractions({
	activeChat,
	isMobile,
	isSidebarOpen,
	setActiveChat,
	setIsSidebarOpen,
	setActiveTab,
	handleCreatePrivateChat,
	handleCreateGroupChat,
}: UseChatInteractionsProps) {

	// Auto-close sidebar when chat is selected
	useEffect(() => {
		if (activeChat) {
			setIsSidebarOpen(false);
		}
	}, [activeChat, setIsSidebarOpen]);

	// Auto-open sidebar when no chat is selected on mobile
	useEffect(() => {
		if (!activeChat && isMobile) {
			setIsSidebarOpen(true);
		}
	}, [activeChat, isMobile, setIsSidebarOpen]);

	const handleActiveChatChange = (chatId: string) => {
		setActiveChat(chatId);
		if (isMobile) {
			setIsSidebarOpen(false);
		}
	};

	const handleCreatePrivateChatWithUI = async (userId: string) => {
		try {
			await handleCreatePrivateChat(userId);
			setActiveTab('chats');
			setIsSidebarOpen(false);
		} catch (error) {
			// Error already handled in hook
		}
	};

	const handleCreateGroupChatWithUI = async (memberIds: string[], groupName?: string) => {
		try {
			await handleCreateGroupChat(memberIds, groupName);
			setActiveTab('chats');
			setIsSidebarOpen(false);
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