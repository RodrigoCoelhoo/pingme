import { useState } from 'react';
import type { MessageResponse } from '../../services/message/message.types';
import styles from '../../styles/chat/MessageBubble.module.css';
import { getColor } from '../../utils/color';
import { formatTime } from '../../utils/time';
import Avatar from '../Avatar';
import { createPortal } from 'react-dom';
import { AlertCircle, Download, X } from 'lucide-react';
import { parseMessage } from '../../utils/messagesParser';

interface MessageBubbleProps {
	message: MessageResponse;
	isOwn: boolean;
	showNameAndAvatar: boolean;
	onRemoveFailed?: (messageId: string) => void;
}

export default function MessageBubble({
	message,
	isOwn,
	showNameAndAvatar,
	onRemoveFailed
}: MessageBubbleProps) {
	const [showImageModal, setShowImageModal] = useState(false);

	if (message.type === 'SYSTEM') {
		return (
			<div className={styles.systemMessage}>
				{parseMessage(message.content)}
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

					{message.type === 'TEXT' && (
						<div className={styles.bubble}>

							<p className={styles.text}>{message.content}</p>

							<div className={styles.metadata}>
								<span className={styles.time}>
									{formatTime(message.createdAt)}
								</span>
							</div>
						</div>
					)}


					{message.type === 'IMAGE' && (
						<div className={styles.imageWrapper}>
							<img
								src={message.content}
								alt="imagem"
								className={`${styles.messageImage} ${message.pending || message.failed ? styles.dimmed : ''}`}
								loading="lazy"
								onClick={() => setShowImageModal(true)}
							/>
							<div className={styles.metadata}>
								<span className={styles.time}>
									{formatTime(message.createdAt)}
								</span>
							</div>
							{message.pending && (
								<div className={styles.progressBarWrapper}>
									<div className={styles.progressBar} />
								</div>
							)}
							{message.failed && (
								<div className={`${styles.imageOverlay} ${styles.failedOverlay}`}>
									<AlertCircle size={20} />
									<span>Falhou</span>
									<button
										className={styles.removeBtn}
										onClick={() => onRemoveFailed?.(message.messageId)}
										title="Remover"
									>
										<X size={14} />
									</button>
								</div>
							)}
						</div>
					)}

					{message.type === 'FILE' && (
						<a
							href={message.pending ? undefined : message.content}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.fileWrapper}
						>
							<Download size={20} className={styles.fileIcon} />
							<span className={styles.fileName}>
								{message.pending
									? message.content
									: decodeURIComponent(
										(new URL(message.content).pathname.split('/').pop() || 'file')
											.replace(/_[^_.]+(?=\.[^.]+$)/, '')
									)
								}
							</span>
							<div className={styles.metadata}>
								<span className={styles.time}>
									{formatTime(message.createdAt)}
								</span>
							</div>

							{message.pending && (
								<div className={styles.progressBarWrapper}>
									<div className={styles.progressBar} />
								</div>
							)}

							{message.failed && (
								<div className={styles.fileFailed}>
									<AlertCircle size={14} />
									<span>Falhou</span>
									<button
										className={styles.removeBtn}
										onClick={() => onRemoveFailed?.(message.messageId)}
										title="Remover"
									>
										<X size={12} />
									</button>
								</div>
							)}
						</a>
					)}
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