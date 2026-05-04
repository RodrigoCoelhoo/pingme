import styles from '../../styles/chat/MessageBubble.module.css';
import type { Message } from '../../services/message/messageTypes';

interface MessageBubbleProps {
	message: Message;
	isOwn: boolean;
	showNameAndAvatar: boolean;
}

export default function MessageBubble({ message, isOwn, showNameAndAvatar }: MessageBubbleProps) {
	const formatTime = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('pt-PT', {
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	return (
		<div className={`${styles.messageWrapper} ${isOwn ? styles.own : styles.other}`}>
			{!isOwn && showNameAndAvatar && (
				<div className={styles.avatar}>
					{message.senderAvatar ? (
						<img src={message.senderAvatar} alt={message.senderName} />
					) : (
						<div className={styles.avatarPlaceholder}>
							{message.senderName.charAt(0).toUpperCase()}
						</div>
					)}
				</div>
			)}

			{!isOwn && !showNameAndAvatar && <div className={styles.avatarSpacer} />}

			<div className={styles.messageContent}>
				{showNameAndAvatar && !isOwn && (
					<span className={styles.senderName}>{message.senderName}</span>
				)}

				<div className={styles.bubble}>
					<p className={styles.text}>{message.content}</p>
					<div className={styles.metadata}>
						<span className={styles.time}>{formatTime(message.timestamp)}</span>
						{isOwn && (
							<span className={`${styles.status} ${message.isRead ? styles.read : ''}`}>
								{message.isRead ? '✓✓' : '✓'}
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
