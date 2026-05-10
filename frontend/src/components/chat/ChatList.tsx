import type { ChatPreview } from '../../services/chat/chat.types';
import ChatListItem from './ChatListItem';
import styles from '../../styles/chat/ChatList.module.css';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

interface ChatListProps {
	chats: ChatPreview[];
	activeChat: string | null;
	onChatSelect: (chatId: string) => void;
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
	const { containerRef } = useInfiniteScroll(onLoadMore, hasMore, isLoading);

	if (chats.length === 0 && !isLoading) {
		return (
			<div className={styles.chatListEmpty}>
				<p>Nenhuma conversa ainda</p>
				<span>Clica no + para começar uma nova conversa</span>
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