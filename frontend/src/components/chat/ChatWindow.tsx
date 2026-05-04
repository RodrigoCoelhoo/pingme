import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Loader } from 'lucide-react';
import type { Message } from '../../services/message/messageTypes';
import type { ChatPreview } from '../../services/chat/chatTypes';
import messageService from '../../services/message/messageService';
import chatService from '../../services/chat/chatService';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import styles from '../../styles/chat/ChatWindow.module.css';
import { useAuth } from '../../contexts/AuthContext';

interface ChatWindowProps {
	chatId: string | null;
	setSidebarOpen: (open: boolean) => void;
}

export default function ChatWindow({ chatId, setSidebarOpen }: ChatWindowProps) {
	const [messages, setMessages] = useState<Message[]>([
		{
			messageId: "msg-1",
			chatId: "chat-123",
			senderId: "user-1",
			senderName: "Alice",
			senderAvatar: "https://i.pravatar.cc/150?img=1",
			content: "Hey, how are you? 🙂",
			timestamp: "2026-05-03T10:15:00Z",
			isRead: true,
		},
		{
			messageId: "msg-2",
			chatId: "chat-123",
			senderId: "user-2",
			senderName: "Bob",
			senderAvatar: "https://i.pravatar.cc/150?img=2",
			content: "I'm good! Working on the project.",
			timestamp: "2026-05-03T10:16:30Z",
			isRead: true,
		},
		{
			messageId: "msg-3",
			chatId: "chat-123",
			senderId: "user-1",
			senderName: "Alice",
			senderAvatar: "https://i.pravatar.cc/150?img=1",
			content: "Nice, same here 😄",
			timestamp: "2026-05-03T10:17:10Z",
			isRead: true,
		},
		{
			messageId: "msg-4",
			chatId: "chat-123",
			senderId: "user-2",
			senderName: "Bob",
			senderAvatar: "https://i.pravatar.cc/150?img=2",
			content: "Want to jump on a call later?",
			timestamp: "2026-05-03T10:18:45Z",
			isRead: false,
		},
		{
			messageId: "msg-5",
			chatId: "chat-123",
			senderId: "user-1",
			senderName: "Alice",
			senderAvatar: "https://i.pravatar.cc/150?img=1",
			content: "Sure, sounds good 👍",
			timestamp: "2026-05-03T10:19:20Z",
			isRead: false,
		},
		{
			messageId: "msg-2",
			chatId: "chat-123",
			senderId: "user-2",
			senderName: "Bob",
			senderAvatar: "https://i.pravatar.cc/150?img=2",
			content: "I'm good! Working on the project.",
			timestamp: "2026-05-03T10:16:30Z",
			isRead: true,
		},
		{
			messageId: "msg-3",
			chatId: "chat-123",
			senderId: "user-1",
			senderName: "Alice",
			senderAvatar: "https://i.pravatar.cc/150?img=1",
			content: "Nice, same here 😄",
			timestamp: "2026-05-03T10:17:10Z",
			isRead: true,
		},
		{
			messageId: "msg-4",
			chatId: "chat-123",
			senderId: "user-2",
			senderName: "Bob",
			senderAvatar: "https://i.pravatar.cc/150?img=2",
			content: "Want to jump on a call later?",
			timestamp: "2026-05-03T10:18:45Z",
			isRead: false,
		},
		{
			messageId: "msg-5",
			chatId: "chat-123",
			senderId: "user-1",
			senderName: "Alice",
			senderAvatar: "https://i.pravatar.cc/150?img=1",
			content: "Sure, sounds good 👍",
			timestamp: "2026-05-03T10:19:20Z",
			isRead: false,
		},
		{
			messageId: "msg-2",
			chatId: "chat-123",
			senderId: "user-2",
			senderName: "Bob",
			senderAvatar: "https://i.pravatar.cc/150?img=2",
			content: "I'm good! Working on the project.",
			timestamp: "2026-05-03T10:16:30Z",
			isRead: true,
		},
		{
			messageId: "msg-3",
			chatId: "chat-123",
			senderId: "user-1",
			senderName: "Alice",
			senderAvatar: "https://i.pravatar.cc/150?img=1",
			content: "Nice, same here 😄",
			timestamp: "2026-05-03T10:17:10Z",
			isRead: true,
		},
		{
			messageId: "msg-4",
			chatId: "chat-123",
			senderId: "user-2",
			senderName: "Bob",
			senderAvatar: "https://i.pravatar.cc/150?img=2",
			content: "Want to jump on a call later?",
			timestamp: "2026-05-03T10:18:45Z",
			isRead: false,
		},
		{
			messageId: "msg-5",
			chatId: "chat-123",
			senderId: "user-1",
			senderName: "Alice",
			senderAvatar: "https://i.pravatar.cc/150?img=1",
			content: "Sure, sounds good 👍",
			timestamp: "2026-05-03T10:19:20Z",
			isRead: false,
		}
	]);
	const [chat, setChat] = useState<ChatPreview | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	const { user } = useAuth();
	const currentUserId = user?.id || 'current-user-id';

	useEffect(() => {
		if (chatId) {
			loadChatAndMessages();
		}
	}, [chatId]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const loadChatAndMessages = async () => {
		if (!chatId) return;

		setIsLoading(true);
		try {
			// Load chat details
			const chats = await chatService.getMyChats();
			const currentChat = chats.find(c => c.chatId === chatId);
			if (currentChat) {
				setChat(currentChat);
			}

			// Load messages
			const msgs = await messageService.getChatMessages(chatId);
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
		if (!chatId) return;

		try {
			const newMessage = await messageService.sendMessage(chatId, { content });
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

	if (!chatId) {
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
			{chat && <ChatHeader chat={chat} setSidebarOpen={setSidebarOpen} />}

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
};
