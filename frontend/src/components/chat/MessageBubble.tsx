import { useState } from 'react';
import type { MessageResponse } from '../../services/message/message.types';
import styles from '../../styles/chat/MessageBubble.module.css';
import { getColor } from '../../utils/color';
import { parseSystemMessage } from '../../utils/systemMessages.tsx';
import { formatTime } from '../../utils/time';
import Avatar from '../Avatar';
import { createPortal } from 'react-dom';
import { Download, X } from 'lucide-react';

interface MessageBubbleProps {
	message: MessageResponse;
	isOwn: boolean;
	showNameAndAvatar: boolean;
}

export default function MessageBubble({
	message,
	isOwn,
	showNameAndAvatar
}: MessageBubbleProps) {
	const [showImageModal, setShowImageModal] = useState(false);

	if (message.type === 'SYSTEM') {
		return (
			<div className={styles.systemMessage}>
				{parseSystemMessage(message.content)}
			</div>
		);
	}

	const nameColor = getColor(message.senderDisplayName);

	const handleDownload = async () => {
		try {
			const response = await fetch(message.content);
			const blob = await response.blob();

			const url = window.URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = 'image';
			document.body.appendChild(link);

			link.click();

			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Download failed', err);
		}
	};

	return (
		<>
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
						<span
							className={styles.senderName}
							style={{ color: nameColor }}
						>
							{message.senderDisplayName}
						</span>
					)}

					<div className={styles.bubble}>
						{message.type === 'TEXT' && (
							<p className={styles.text}>{message.content}</p>
						)}

						{message.type === 'IMAGE' && (
							<div className={styles.imageContainer}>
								<img
									src={message.content}
									alt="Sent image"
									className={styles.image}
									loading="lazy"
									onClick={() => setShowImageModal(true)}
								/>
							</div>
						)}

						{message.type === 'FILE' && (
							<a
								href={message.content}
								target="_blank"
								rel="noopener noreferrer"
								className={styles.fileContainer}
							>
								<div className={styles.fileIcon}>📎</div>

								<div className={styles.fileInfo}>
									<span className={styles.fileName}>
										{decodeURIComponent(
											new URL(message.content).searchParams.get('target_filename') || 'file'
										)}
									</span>

									<span className={styles.fileAction}>
										Download
									</span>
								</div>
							</a>
						)}

						<div className={styles.metadata}>
							<span className={styles.time}>
								{formatTime(message.createdAt)}
							</span>
						</div>
					</div>
				</div>
			</div>

			{showImageModal &&
				createPortal(
					<div
						className={styles.imageModalOverlay}
						onClick={() => setShowImageModal(false)}
					>
						<div
							className={styles.imageModalContent}
							onClick={(e) => e.stopPropagation()}
						>
							<div className={styles.imageModalActions}>
								<button
									className={styles.modalButton}
									onClick={handleDownload}
								>
									<Download />
								</button>

								<button
									className={styles.modalButton}
									onClick={() => setShowImageModal(false)}
								>
									<X />
								</button>
							</div>

							<img
								src={message.content}
								alt="Full preview"
								className={styles.imageModal}
							/>
						</div>
					</div>,
					document.body
				)}
		</>
	);
}