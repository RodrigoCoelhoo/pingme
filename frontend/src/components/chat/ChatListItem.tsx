import React, { useState } from 'react';
import type { ChatPreview } from '../../services/chat/chatTypes';
import { X } from 'lucide-react';
import styles from '../../styles/chat/ChatListItem.module.css';

interface ChatListItemProps {
	chat: ChatPreview;
	isActive: boolean;
	onClick: () => void;
	onDelete?: (chatId: string) => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
	chat,
	isActive,
	onClick,
	onDelete
}) => {
	const [isHovered, setIsHovered] = useState(false);

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete) {
			onDelete(chat.chatId);
		}
	};

	const formatLastMessage = () => {
		if (!chat.lastMessage) return '';
		const prefix = chat.lastMessage.userDisplayName
			? `${chat.lastMessage.userDisplayName}: `
			: '';
		return `${prefix}${chat.lastMessage.message}`;
	};

	return (
		<div
			className={`${styles.chatListItem} ${isActive ? styles.active : ''}`}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className={styles.chatAvatar}>
				{chat.chatImageUrl ? (
					<img src={chat.chatImageUrl} alt={chat.chatName} />
				) : (
					<div className={styles.chatAvatarPlaceholder}>
						{chat.chatName.charAt(0).toUpperCase()}
					</div>
				)}
			</div>

			<div className={styles.chatInfo}>
				<div className={styles.chatHeader}>
					<h3 className={styles.chatName}>{chat.chatName}</h3>
					{chat.unreadCount > 0 && (
						<span className={styles.unreadBadge}>{chat.unreadCount}</span>
					)}
				</div>

				{chat.lastMessage && (
					<p className={styles.lastMessage}>{formatLastMessage()}</p>
				)}
			</div>

			{isHovered && onDelete && (
				<button
					className={styles.deleteChatBtn}
					onClick={handleDelete}
					aria-label="Delete chat"
				>
					<X size={16} />
				</button>
			)}
		</div>
	);
};

export default ChatListItem;