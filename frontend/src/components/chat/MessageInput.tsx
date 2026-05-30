import React, { useState, useRef, type KeyboardEvent, useEffect } from 'react';
import { SendHorizonal, Smile, Paperclip, X, FileText } from 'lucide-react';
import styles from '../../styles/chat/MessageInput.module.css';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { showError } from '../../utils/toast';
import { useTranslation } from 'react-i18next';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILES = 10;

interface AttachedFile {
	id: string;
	file: File;
	previewUrl?: string; // only for images
}

interface MessageInputProps {
	onSendMessage: (content: string, files?: File[]) => void;
	onTyping?: (isTyping: boolean) => void;
	disabled?: boolean;
	initialValue?: string;
	editMode?: boolean;
	onCancelEdit?: () => void;
}

export default function MessageInput({ onSendMessage, disabled = false, onTyping, initialValue, editMode, onCancelEdit }: MessageInputProps) {
	const [message, setMessage] = useState('');
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const pickerRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const typingTimeoutRef = useRef<any>(null);
	const isTypingRef = useRef(false);

	const { theme } = useTheme();
	const { t } = useTranslation("chat");
	const { t: tToast } = useTranslation("toast");

	const [messageError, setMessageError] = useState('');

	useEffect(() => {
		if (editMode && initialValue !== undefined) {
			setMessage(initialValue);

			setTimeout(() => {
				if (textareaRef.current) {
					textareaRef.current.style.height = 'auto';
					textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
				}
			}, 0);
		}
		if (!editMode) {
			setMessage('');
			setMessageError('');
			setTimeout(() => {
				if (textareaRef.current) {
					textareaRef.current.style.height = 'auto';
				}
			}, 0);
		}
	}, [editMode, initialValue]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				pickerRef.current &&
				!pickerRef.current.contains(event.target as Node)
			) {
				setShowEmojiPicker(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Revoke object URLs on unmount to avoid memory leaks
	useEffect(() => {
		return () => {
			attachedFiles.forEach(f => {
				if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
			});
		};
	}, [attachedFiles]);

	const handleSend = () => {
		if (messageError) return;

		if (!message.trim() && attachedFiles.length === 0) return;

		if (onTyping && isTypingRef.current) {
			onTyping(false);
			isTypingRef.current = false;
		}
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

		if (!disabled) {
			onSendMessage(
				message.trim(),
				attachedFiles.length > 0 ? attachedFiles.map(f => f.file) : undefined
			);
			setMessage('');
			setAttachedFiles([]);
			// Reset textarea height via the ref
			if (textareaRef.current) {
				textareaRef.current.style.height = 'auto';
			}
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const validateMessage = (value: string) => {
		if (value.length > 1024) {
			return 'A mensagem não pode exceder 1024 caracteres.';
		}

		return '';
	};

	const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		setMessage(value);

		const error = validateMessage(value);
		setMessageError(error);

		// Auto-resize textarea
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
		}

		if (onTyping && value.trim()) {
			// Start typing
			if (!isTypingRef.current) {
				onTyping(true);
				isTypingRef.current = true;
			}

			// Clear previous timeout
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}

			// Stop typing after 2 seconds of inactivity
			typingTimeoutRef.current = setTimeout(() => {
				if (onTyping && isTypingRef.current) {
					onTyping(false);
					isTypingRef.current = false;
				}
			}, 2000);
		} else if (onTyping && !value.trim() && isTypingRef.current) {
			// Stop typing immediately if input is cleared
			onTyping(false);
			isTypingRef.current = false;
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		}
	};

	const handleEmojiClick = (emojiData: any) => {
		setMessage(prev => prev + emojiData.emoji);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				pickerRef.current &&
				!pickerRef.current.contains(event.target as Node)
			) {
				setShowEmojiPicker(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		if (files.length === 0) return;

		const validFiles: File[] = [];

		for (const file of files) {
			if (file.size > MAX_FILE_SIZE_BYTES) {
				showError(tToast('media.fileSizeLimit', { fileName: file.name, size: MAX_FILE_SIZE_MB, unit: 'MB' }));
				continue;
			}
			validFiles.push(file);
		}

		setAttachedFiles(prev => {
			const slotsAvailable = MAX_FILES - prev.length;

			if (slotsAvailable <= 0) {
				showError(tToast('media.fileLimit', { count: MAX_FILES }));
				return prev;
			}

			const accepted = validFiles.slice(0, slotsAvailable);
			const rejected = validFiles.slice(slotsAvailable);

			if (rejected.length > 0) {
				showError(tToast('media.filesIgnored', { count: rejected.length, limit: MAX_FILES }));
			}

			const newAttachments: AttachedFile[] = accepted.map(file => ({
				id: `${file.name}-${Date.now()}-${Math.random()}`,
				file,
				previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
			}));

			return [...prev, ...newAttachments];
		});

		e.target.value = '';
	};

	const removeFile = (id: string) => {
		setAttachedFiles(prev => {
			const removed = prev.find(f => f.id === id);
			if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
			return prev.filter(f => f.id !== id);
		});
	};

	const canSend =
		(message.trim().length > 0 || attachedFiles.length > 0) &&
		!messageError &&
		!disabled;

	return (
		<div className={styles.messageInputWrapper}>
			{editMode && initialValue && (
				<div className={styles.editContainer}>
					<div className={styles.editPreview}>
						<div className={styles.editPreviewBar} />
						<div className={styles.editPreviewContent}>
							<span className={styles.editPreviewLabel}>A editar mensagem</span>
							<p className={styles.editPreviewText}>{initialValue}</p>
						</div>
						<button className={styles.editPreviewClose} onClick={onCancelEdit} type="button">
							<X size={16} />
						</button>
					</div>
				</div>
			)}

			{/* File preview strip */}
			{attachedFiles.length > 0 && (
				<div className={styles.filePreviewStrip}>
					{attachedFiles.map(({ id, file, previewUrl }) => (
						<div key={id} className={styles.fileChip}>
							{previewUrl ? (
								<img src={previewUrl} alt={file.name} className={styles.fileChipThumb} />
							) : (
								<div className={styles.fileChipIcon}>
									<FileText size={16} />
								</div>
							)}
							<span className={styles.fileChipName}>{file.name}</span>
							<button
								className={styles.fileChipRemove}
								onClick={() => removeFile(id)}
								title="Remover ficheiro"
								type="button"
							>
								<X size={12} />
							</button>
						</div>
					))}
					<span className={styles.fileSlotCounter}>
						{attachedFiles.length}/{MAX_FILES}
					</span>
				</div>
			)}

			<div className={styles.messageInput}>
				<button
					className={styles.iconBtn}
					onClick={() => setShowEmojiPicker(prev => !prev)}
					type="button"
				>
					<Smile size={20} />
				</button>

				{showEmojiPicker && (
					<div style={{ position: 'absolute', bottom: '60px', zIndex: 10 }} ref={pickerRef}>
						<EmojiPicker
							onEmojiClick={handleEmojiClick}
							theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
						/>
					</div>
				)}

				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					multiple
					style={{ display: 'none' }}
					onChange={handleFileChange}
					disabled={disabled}
				/>

				<button
					className={`${styles.iconBtn} ${attachedFiles.length > 0 ? styles.iconBtnActive : ''}`}
					title={attachedFiles.length >= MAX_FILES ? `Limite de ${MAX_FILES} ficheiros atingido` : 'Anexar ficheiro'}
					onClick={() => fileInputRef.current?.click()}
					disabled={disabled || attachedFiles.length >= MAX_FILES || editMode}
					type="button"
				>
					<Paperclip size={20} />
					{attachedFiles.length > 0 && (
						<span className={styles.fileBadge}>{attachedFiles.length}</span>
					)}
				</button>

				<div
					className={`${styles.inputWrapper} ${messageError ? styles.inputWrapperError : ''
						}`}
				>
					<textarea
						ref={textareaRef}
						className={`${styles.textarea} ${messageError ? styles.textareaError : ''}`}
						placeholder={t('inputPlaceholder')}
						value={message}
						onChange={handleInput}
						onKeyDown={handleKeyDown}
						disabled={disabled}
						rows={1}
					/>

					<div className={styles.messageMeta}>
						<span
							className={`${styles.charCount} ${message.length > 1024 ? styles.charCountError : ''
								}`}
						>
							{message.length}/1024
						</span>
					</div>
				</div>

				<button
					className={`${styles.sendBtn} ${canSend ? styles.active : ''}`}
					onClick={handleSend}
					disabled={!canSend}
					title="Enviar"
					type="button"
				>
					<SendHorizonal size={20} />
				</button>
			</div>
		</div>
	);
}