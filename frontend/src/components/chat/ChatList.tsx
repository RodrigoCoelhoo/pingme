import type { ChatPreview } from '../../services/chat/chat.types';
import ChatListItem from './ChatListItem';
import styles from '../../styles/chat/ChatList.module.css';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useTranslation } from 'react-i18next';

interface ChatListProps {
	chats: ChatPreview[];
	activeChat: string | null;
	onChatSelect: (chat: string | null) => void;
	onDeleteChat?: (chatId: string) => void;
	isLoading: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
}

export default function ChatList({
	chats,
	activeChat,
	onChatSelect,
	onDeleteChat,
	isLoading,
	hasMore,
	onLoadMore
}: ChatListProps) {
	const { containerRef } = useInfiniteScroll(onLoadMore, hasMore, isLoading, {direction: 'bottom'});

	const { t }	= useTranslation("sidebar");

	if (chats.length === 0 && !isLoading) {
		return (
			<div className={styles.chatListEmpty}>
				<p>{t('chats.noChats')}</p>
				<span>{t('chats.noChatsDescription')}</span>
			</div>
		);
	}

	return (
		<div ref={containerRef} className={styles.chatList}>
			{chats.map((chat) => (
				<ChatListItem
					key={chat.chatId}
					chat={chat}
					isActive={activeChat === chat.chatId}
					onClick={() => onChatSelect(chat.chatId)}
					onDelete={onDeleteChat}
				/>
			))}

			{isLoading && (
				<div className={styles.loading}>
					<div className={styles.spinner}></div>
					<span>A carregar mais conversas...</span>
				</div>
			)}
		</div>
	);
}