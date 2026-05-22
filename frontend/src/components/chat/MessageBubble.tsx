import type { MessageResponse } from '../../services/message/message.types';
import styles from '../../styles/chat/MessageBubble.module.css';
import { getColor } from '../../utils/color';
import { parseSystemMessage } from '../../utils/systemMessages.tsx';
import { formatTime } from '../../utils/time';
import Avatar from '../Avatar';

interface MessageBubbleProps {
	message: MessageResponse;
	isOwn: boolean;
	showNameAndAvatar: boolean;
}

export default function MessageBubble({ message, isOwn, showNameAndAvatar }: MessageBubbleProps) {
	if (message.type === 'SYSTEM') {
		return (
			<div className={styles.systemMessage}>
				{parseSystemMessage(message.content)}
			</div>
		);
	}

	const nameColor = getColor(message.senderDisplayName);

	return (
		<div className={`${styles.messageWrapper} ${isOwn ? styles.own : styles.other}`}>
			{!isOwn && showNameAndAvatar && (
				<div className={styles.avatar}>
					<Avatar
						name={message?.senderDisplayName || 'User'}
						src={message.senderAvatarUrl}
					/>
				</div>
			)}

			{!isOwn && !showNameAndAvatar && <div className={styles.avatarSpacer} />}
			{isOwn && <div className={styles.ownSpacer} />}

			<div className={styles.messageContent}>
				{showNameAndAvatar && !isOwn && (
					<span className={styles.senderName} style={{ color: nameColor }}>{message.senderDisplayName}</span>
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
