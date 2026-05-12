import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Loader } from 'lucide-react';
import type { Message } from '../../services/message/message.types';
import type { ChatPreview } from '../../services/chat/chat.types';
import { MemberRole } from '../../services/chat/chat.types';
import messageService from '../../services/message/message.service';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import styles from '../../styles/chat/ChatWindow.module.css';
import { useAuth } from '../../contexts/AuthContext';

interface ChatWindowProps {
	chat: ChatPreview | null;
	setSidebarOpen: (open: boolean) => void;
	onLeaveGroup: (chatId: string) => void;
	onDeleteGroup: (chatId: string) => void;
	onTransferOwnership: (chatId: string, memberId: string) => void;
	onKickMember: (chatId: string, memberId: string) => void;
	onAddMembers: (chatId: string, memberIds: string[]) => void;
	onUpdateGroupName: (chatId: string, name: string) => void;
	onUpdateGroupImage: (chatId: string, file: File) => void;
	onPromoteMember: (chatId: string, memberId: string, newRole: MemberRole) => void;
	onMuteChat: (chatId: string) => void;
	onSendContactRequest: (userId: string) => void;
}

export default function ChatWindow({
	chat,
	setSidebarOpen,
	onLeaveGroup,
	onDeleteGroup,
	onTransferOwnership,
	onKickMember,
	onAddMembers,
	onUpdateGroupName,
	onUpdateGroupImage,
	onPromoteMember,
	onMuteChat,
	onSendContactRequest
}: ChatWindowProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	const { user } = useAuth();
	const currentUserId = user?.id || '';

	useEffect(() => {
		if (!chat?.chatId) return;

		setMessages([]);
		loadMessages();
	}, [chat?.chatId]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const loadMessages = async () => {
		if (!chat?.chatId) return;

		setIsLoading(true);
		try {
			const msgs = await messageService.getChatMessages(chat.chatId);
			setMessages(msgs);
		} catch (error) {
			console.error('Error loading chat:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	const handleSendMessage = async (content: string) => {
		if (!chat?.chatId) return;

		try {
			const newMessage = await messageService.sendMessage(chat.chatId, { content });
			setMessages(prev => [...prev, newMessage]);
		} catch (error) {
			console.error('Error sending message:', error);
		}
	};

	const shouldShowNameAndAvatar = (index: number): boolean => {
		if (index === 0) return true;
		const current = messages[index];
		const prev = messages[index - 1];
		return current.senderId !== prev?.senderId;
	};

	if (!chat?.chatId) {
		return (
			<div className={styles.emptyState}>
				<div className={styles.emptyContent}>
					<MessageCircle size={80} strokeWidth={1.5} />
					<h2>Seleciona uma conversa</h2>
					<p>Escolhe uma conversa da lista ou cria uma nova</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className={styles.loadingState}>
				<Loader size={48} className={styles.spinner} />
				<p>A carregar mensagens...</p>
			</div>
		);
	}

	return (
		<div className={styles.chatWindow}>
			<ChatHeader
				chat={chat}
				setSidebarOpen={setSidebarOpen}
				onLeaveGroup={() => onLeaveGroup(chat.chatId)}
				onDeleteGroup={() => onDeleteGroup(chat.chatId)}
				onTransferOwnership={(memberId) => onTransferOwnership(chat.chatId, memberId)}
				onKickMember={(memberId) => onKickMember(chat.chatId, memberId)}
				onAddMembers={onAddMembers}
				onUpdateGroupName={(name) => onUpdateGroupName(chat.chatId, name)}
				onUpdateGroupImage={(file) => onUpdateGroupImage(chat.chatId, file)}
				onPromoteMember={(memberId, newRole) => onPromoteMember(chat.chatId, memberId, newRole)}
				onMuteChat={() => onMuteChat(chat.chatId)}
				onSendContactRequest={onSendContactRequest}
			/>

			<div className={styles.messagesContainer} ref={messagesContainerRef}>
				<div className={styles.messagesWrapper}>
					{messages.length === 0 ? (
						<div className={styles.noMessages}>
							<MessageCircle size={48} strokeWidth={1.5} />
							<p>Nenhuma mensagem ainda</p>
							<span>Envia a primeira mensagem para começar a conversa</span>
						</div>
					) : (
						<>
							{messages.map((message, index) => (
								<MessageBubble
									key={message.messageId}
									message={message}
									isOwn={message.senderId === currentUserId}
									showNameAndAvatar={shouldShowNameAndAvatar(index)}
								/>
							))}
							<div ref={messagesEndRef} />
						</>
					)}
				</div>
			</div>

			<MessageInput onSendMessage={handleSendMessage} />
		</div>
	);
}