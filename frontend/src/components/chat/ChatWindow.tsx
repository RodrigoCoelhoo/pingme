import React from 'react';
import { MessageCircle } from 'lucide-react';
import styles from '../../styles/chat/ChatWindow.module.css';

interface ChatWindowProps {
	chatId: string | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId }) => {
	if (!chatId) {
		return (
			<div className={styles.chatWindowEmpty}>
				<MessageCircle size={64} strokeWidth={1.5} />
				<h2>Seleciona uma conversa</h2>
				<p>Escolhe uma conversa da lista ou cria uma nova</p>
			</div>
		);
	}

	return (
		<div className={styles.chatWindow}>
			<div className={styles.chatWindowHeader}>
				<h3>Chat selecionado: {chatId}</h3>
			</div>
			<div className={styles.chatWindowMessages}>
				{/* Messages will be implemented later */}
				<p className={styles.tempMessage}>Chat em desenvolvimento...</p>
			</div>
			<div className={styles.chatWindowInput}>
				{/* Input will be implemented later */}
			</div>
		</div>
	);
};

export default ChatWindow;