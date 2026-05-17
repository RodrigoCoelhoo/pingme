import type { MessageResponse } from '../../services/message/message.types';
import styles from '../../styles/chat/MessageBubble.module.css';

interface MessageBubbleProps {
	message: MessageResponse;
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
					{message.senderAvatarUrl ? (
						<img src={message.senderAvatarUrl} alt={message.senderDisplayName} />
					) : (
						<div className={styles.avatarPlaceholder}>
							{message.senderDisplayName.charAt(0).toUpperCase()}
						</div>
					)}
				</div>
			)}

			{!isOwn && !showNameAndAvatar && <div className={styles.avatarSpacer} />}

			<div className={styles.messageContent}>
				{showNameAndAvatar && !isOwn && (
					<span className={styles.senderName}>{message.senderDisplayName}</span>
				)}

				<div className={styles.bubble}>
					<p className={styles.text}>{message.content}</p>
					<div className={styles.metadata}>
						<span className={styles.time}>{formatTime(message.createdAt)}</span>
					</div>
				</div>
			</div>
		</div>
	);
};
