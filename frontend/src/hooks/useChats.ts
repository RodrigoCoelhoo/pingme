import { useState, useCallback, useEffect } from 'react';
import type { ChatPreview } from '../services/chat/chat.types';
import chatService from '../services/chat/chat.service';

const CHATS_PAGE_SIZE = 20;

interface UseChatsProps {
	searchQuery?: string;
}

export function useChats({ searchQuery = '' }: UseChatsProps = {}) {
	const [chats, setChats] = useState<ChatPreview[]>([]);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	const loadChats = useCallback(async (pageNum: number, search: string, append: boolean = false) => {
		setIsLoading(true);
		try {
			// When API supports pagination, uncomment:
			// const response = await chatService.getMyChats(pageNum, CHATS_PAGE_SIZE, search);
			const response = await chatService.getMyChats();

			if (append) {
				setChats(prev => [...prev, ...response]);
			} else {
				setChats(response);
			}

			// setHasMore(response.hasNext);
			setHasMore(false); // Temporary until API supports pagination
			setPage(pageNum);
		} catch (error) {
			console.error('Error loading chats:', error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Initial load
	useEffect(() => {
		loadChats(0, '');
	}, [loadChats]);

	// Search with debounce
	useEffect(() => {
		const timer = setTimeout(() => {
			loadChats(0, searchQuery.trim());
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery, loadChats]);

	const loadMore = useCallback(() => {
		if (!isLoading && hasMore) {
			loadChats(page + 1, searchQuery, true);
		}
	}, [isLoading, hasMore, page, searchQuery, loadChats]);

	const insertChatSorted = useCallback((newChat: ChatPreview) => {
		setChats(prev => {
			const exists = prev.some(c => c.chatId === newChat.chatId);
			if (exists) return prev;

			if (newChat.lastMessageTimestamp === null) return [newChat, ...prev];

			const updated = [newChat, ...prev];

			return updated.sort((a, b) => {
				if (!a.lastMessageTimestamp) return -1;
				if (!b.lastMessageTimestamp) return 1;

				return (
					new Date(b.lastMessageTimestamp).getTime() -
					new Date(a.lastMessageTimestamp).getTime()
				);
			});
		});
	}, []);

	const removeChat = useCallback((chatId: string) => {
		setChats(prev => prev.filter(c => c.chatId !== chatId));
	}, []);

	const updateChat = useCallback((chatId: string, updates: Partial<ChatPreview>) => {
		setChats(prev => prev.map(chat =>
			chat.chatId === chatId ? { ...chat, ...updates } : chat
		));
	}, []);

	return {
		chats,
		isLoading,
		hasMore,
		loadMore,
		insertChatSorted,
		removeChat,
		updateChat,
	};
}