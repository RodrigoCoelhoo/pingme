import { useState } from 'react';
import type { MessageResponse } from '../../services/message/message.types';
import styles from '../../styles/chat/MessageBubble.module.css';
import { getColor } from '../../utils/color';
import { formatTime } from '../../utils/time';
import Avatar from '../Avatar';
import { createPortal } from 'react-dom';
import { AlertCircle, Download, Pencil, Trash2, X } from 'lucide-react';
import { parseMessage } from '../../utils/messagesParser';
import { MemberRole } from '../../services/chat/chat.types';

interface MessageBubbleProps {
	message: MessageResponse;
	isOwn: boolean;
	showNameAndAvatar: boolean;
	onRemoveFailed?: (messageId: string) => void;
	onEdit?: (message: MessageResponse) => void;
	onDelete?: (messageId: string) => void;
	currentUserRole?: MemberRole;
}

export default function MessageBubble({
	message,
	isOwn,
	showNameAndAvatar,
	onRemoveFailed,
	onEdit,
	onDelete,
	currentUserRole
}: MessageBubbleProps) {
	const [showMenu, setShowMenu] = useState(false);
	const canEdit = isOwn && !message.deleted && !message.pending && !message.failed && message.type === 'TEXT';
	const canDelete = (isOwn || currentUserRole === MemberRole.MODERATOR || currentUserRole === MemberRole.ADMIN)
		&& !message.pending && !message.failed;
	const showActions = canEdit || canDelete;

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

	if (message.deleted) {
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
						<span
							className={styles.senderName}
							style={{ color: nameColor }}
						>
							{message.senderDisplayName}
						</span>
					)}
					<div className={`${styles.bubble} ${styles.deletedBubble}`}>
						<p className={styles.deletedText}>Mensagem eliminada</p>
					</div>
				</div>
			</div>
		);
	}

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

				{isOwn && showActions && !message.deleted && (
					<div className={styles.messageActions}>
						<button
							className={styles.actionsToggle}
							onClick={() => setShowMenu(v => !v)}
						>
							<Pencil size={14} />
						</button>
						{showMenu && (
							<div className={styles.actionsDropdown}>
								{canEdit && (
									<button onClick={() => { onEdit?.(message); setShowMenu(false); }}>
										<Pencil size={14} /> Editar
									</button>
								)}
								{canDelete && (
									<button onClick={() => { onDelete?.(message.messageId); setShowMenu(false); }} className={styles.deleteBtn}>
										<Trash2 size={14} /> Eliminar
									</button>
								)}
							</div>
						)}
					</div>
				)}

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
								{message.editedAt && 
								<div className={styles.editedInfo}>
									<Pencil size={11} />
									<span className={styles.editedLabel}>editado</span>
									</div>}
								<span className={styles.time}>{formatTime(message.createdAt)}</span>
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

				{!isOwn && showActions && !message.deleted && (
					<div className={styles.messageActions}>
						<button
							className={styles.actionsToggle}
							onClick={() => setShowMenu(v => !v)}
						>
							<Pencil size={14} />
						</button>
						{showMenu && (
							<div className={styles.actionsDropdown}>
								{canEdit && (
									<button onClick={() => { onEdit?.(message); setShowMenu(false); }}>
										<Pencil size={14} /> Editar
									</button>
								)}
								{canDelete && (
									<button onClick={() => { onDelete?.(message.messageId); setShowMenu(false); }} className={styles.deleteBtn}>
										<Trash2 size={14} /> Eliminar
									</button>
								)}
							</div>
						)}
					</div>
				)}
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