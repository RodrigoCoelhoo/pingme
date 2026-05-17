import React, { useState, useRef, type KeyboardEvent, useEffect } from 'react';
import { SendHorizonal, Smile, Paperclip } from 'lucide-react';
import styles from '../../styles/chat/MessageInput.module.css';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';

interface MessageInputProps {
	onSendMessage: (content: string) => void;
	onTyping?: (isTyping: boolean) => void; // NEW
	disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled = false, onTyping }: MessageInputProps) {
	const [message, setMessage] = useState('');
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const pickerRef = useRef<HTMLDivElement>(null);

	const typingTimeoutRef = useRef<any>(null);
	const isTypingRef = useRef(false);

	const { theme } = useTheme();

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

	const handleSend = () => {
		if (!message.trim()) return;
 
		if (onTyping && isTypingRef.current) {
			onTyping(false);
			isTypingRef.current = false;
		}
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		if (message.trim() && !disabled) {
			onSendMessage(message.trim());
			setMessage('');
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

	const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		setMessage(value);

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

	return (
		<div className={styles.messageInput}>
			<button
				className={styles.iconBtn}
				onClick={() => setShowEmojiPicker(prev => !prev)}
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

			<button
				className={styles.iconBtn}
				title="Anexar ficheiro (em breve)"
				disabled
			>
				<Paperclip size={20} />
			</button>

			<div className={styles.inputWrapper}>
				<textarea
					ref={textareaRef}
					className={styles.textarea}
					placeholder="Escreve uma mensagem..."
					value={message}
					onChange={handleInput}
					onKeyDown={handleKeyDown}
					disabled={disabled}
					rows={1}
				/>
			</div>

			<button
				className={`${styles.sendBtn} ${message.trim() ? styles.active : ''}`}
				onClick={handleSend}
				disabled={!message.trim() || disabled}
				title="Enviar"
			>
				<SendHorizonal size={20} />
			</button>
		</div>
	);
};
