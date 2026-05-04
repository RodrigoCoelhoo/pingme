import React, { useState, useRef, type KeyboardEvent } from 'react';
import { SendHorizonal, Smile, Paperclip } from 'lucide-react';
import styles from '../../styles/chat/MessageInput.module.css';

interface MessageInputProps {
	onSendMessage: (content: string) => void;
	disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
	const [message, setMessage] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSend = () => {
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
		setMessage(e.target.value);

		// Auto-resize textarea
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
		}
	};

	return (
		<div className={styles.messageInput}>
			<button
				className={styles.iconBtn}
				title="Emojis (em breve)"
				disabled
			>
				<Smile size={20} />
			</button>

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
