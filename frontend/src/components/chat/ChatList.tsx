import type { ChatPreview } from '../../services/chat/chat.types';
import ChatListItem from './ChatListItem';
import styles from '../../styles/chat/ChatList.module.css';

interface ChatListProps {
	chats: ChatPreview[];
	activeChat: string | null;
	onChatSelect: (chatId: string) => void;
	onDeleteChat?: (chatId: string) => void;
}

export default function ChatList({ chats, activeChat, onChatSelect, onDeleteChat }: ChatListProps) {
	if (chats.length === 0) {
		return (
			<div className={styles.chatListEmpty}>
				<p>Nenhuma conversa ainda</p>
				<span>Clica no + para começar uma nova conversa</span>
			</div>
		);
	}

	return (
		<div className={styles.chatList}>
			{chats.map((chat) => (
				<ChatListItem
					key={chat.chatId}
					chat={chat}
					isActive={activeChat === chat.chatId}
					onClick={() => onChatSelect(chat.chatId)}
					onDelete={onDeleteChat}
				/>
			))}
		</div>
	);
};
