import React, { useEffect, useMemo, useState } from 'react';
import { MemberRole, type ChatPreview } from '../../services/chat/chat.types';
import { X } from 'lucide-react';
import styles from '../../styles/chat/ChatListItem.module.css';
import Avatar from '../Avatar';
import { formatTime } from '../../utils/time';
import { parseMessage } from '../../utils/messagesParser';
import { useTranslation } from 'react-i18next';

interface ChatListItemProps {
	chat: ChatPreview;
	isActive: boolean;
	onClick: () => void;
	onDelete?: (chatId: string) => void;
}

export default function ChatListItem({ chat, isActive, onClick, onDelete }: ChatListItemProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	const { t } = useTranslation("system");

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const parsedMessage = useMemo(() => {
		if (chat.lastMessageDeleted) return 'Message deleted';
		if (!chat.lastMessage) return '';

		return parseMessage(chat.lastMessage, t);
	}, [chat.lastMessage, chat.lastMessageDeleted]);

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();

		if (onDelete) {
			onDelete(chat.chatId);
		}
	};

	return (
		<div
			className={`${styles.chatListItem} ${isActive ? styles.active : ''}`}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<Avatar name={chat.chatName} src={chat.chatImageUrl} size={isMobile ? 'sm' : 'md'} />

			<div className={styles.chatInfo}>
				<div className={styles.topRow}>
					<h3 className={styles.chatName}>{chat.chatName}</h3>

					{chat.lastMessageTimestamp && (
						<span className={styles.lastMessageTime}>
							{formatTime(chat.lastMessageTimestamp)}
						</span>
					)}
				</div>

				<div className={styles.bottomRow}>
					{(chat.lastMessage || chat.lastMessageDeleted) && (
						<div className={styles.lastMessage}>{parsedMessage}</div>
					)}

					{chat.unreadCount > 0 && (
						<span className={styles.unreadBadge}>
							{chat.unreadCount}
						</span>
					)}
				</div>
			</div>

			{chat.role != MemberRole.ADMIN && isHovered && onDelete && (
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