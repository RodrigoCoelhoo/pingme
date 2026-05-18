import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Loader, ArrowDown } from 'lucide-react';
import type { MessageResponse } from '../../services/message/message.types';
import type { ChatPreview } from '../../services/chat/chat.types';
import { MemberRole } from '../../services/chat/chat.types';
import messageService from '../../services/message/message.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useAuth } from '../../contexts/AuthContext';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import styles from '../../styles/chat/ChatWindow.module.css';
import type { TypingIndicator } from '../../services/websocket/websocket.types';

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
	const [messages, setMessages] = useState<MessageResponse[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(0);
	const [hasMoreMessages, setHasMoreMessages] = useState(true);
	const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const typingTimeoutsRef = useRef<Map<string, any>>(new Map());
	const loadedChatIdRef = useRef<string | null>(null);
	const messagesSizeRef = useRef(50);
	const shouldScrollToBottomRef = useRef(false);

	const { user } = useAuth();
	const currentUserId = user?.id || '';
	const tokenRef = useRef(localStorage.getItem('accessToken'));

	const loadMoreMessages = useCallback(async () => {
		if (!chat?.chatId || !hasMoreMessages || isLoadingMore) return;

		setIsLoadingMore(true);

		try {
			const nextPage = currentPage + 1;

			const olderMessages = await messageService.getChatMessages(
				chat.chatId,
				nextPage,
				messagesSizeRef.current
			);

			if (olderMessages.content.length === 0) {
				setHasMoreMessages(false);
			} else {
				setMessages(prev => {
					return [...olderMessages.content, ...prev];
				});

				setCurrentPage(nextPage);
				setHasMoreMessages(olderMessages.hasNext);
			}
		} catch (error) {
			console.error('❌ Error loading more messages:', error);
		} finally {
			setIsLoadingMore(false);
		}
	}, [
		chat?.chatId,
		currentPage,
		hasMoreMessages,
		isLoadingMore
	]);

	const {
		containerRef,
		isAtBottom,
		scrollToBottom
	} = useInfiniteScroll(
		loadMoreMessages,
		hasMoreMessages,
		isLoadingMore,
		{
			threshold: 100,
			direction: 'top',
			dependency: messages.length
		}
	);

	const handleMessageReceived = useCallback((wsMessage: MessageResponse) => {
		setMessages(prev => {
			const exists = prev.some(
				msg => msg.messageId === wsMessage.messageId
			);

			if (exists) return prev;

			return [...prev, wsMessage];
		});

		if (isAtBottom) {
			requestAnimationFrame(() => {
				scrollToBottom();
			});
		}
	}, [isAtBottom, scrollToBottom, messages.length]);

	const handleTypingReceived = useCallback((indicator: TypingIndicator) => {
		if (indicator.userId === currentUserId) return;

		setTypingUsers(prev => {
			const updated = new Set(prev);

			if (indicator.isTyping) {
				updated.add(indicator.displayName);
			} else {
				updated.delete(indicator.displayName);
			}

			return updated;
		});

		const existingTimeout =typingTimeoutsRef.current.get(indicator.userId);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}

		if (indicator.isTyping) {
			const timeout = setTimeout(() => {
				setTypingUsers(prev => {
					const updated = new Set(prev);
					updated.delete(indicator.displayName);
					return updated;
				});

				typingTimeoutsRef.current.delete(indicator.userId);
			}, 3000);

			typingTimeoutsRef.current.set(indicator.userId, timeout);
		}
	}, [currentUserId]);

	// Initialize WebSocket
	const { sendMessage: sendWsMessage, sendTyping } = useWebSocket({
		chatId: chat?.chatId || null,
		token: tokenRef.current,
		onMessageReceived: handleMessageReceived,
		onTypingReceived: handleTypingReceived,
		enabled: !!chat?.chatId
	});

	useEffect(() => {
		if (!chat?.chatId) {
			loadedChatIdRef.current = null;
			return;
		}

		if (loadedChatIdRef.current === chat.chatId) {
			return;
		}

		loadedChatIdRef.current = chat.chatId;

		// Reset state
		setMessages([]);
		setTypingUsers(new Set());
		setCurrentPage(0);
		setHasMoreMessages(true);
		shouldScrollToBottomRef.current = true;

		loadMessages();
	}, [chat?.chatId]);

	useEffect(() => {
		if (isLoading || !shouldScrollToBottomRef.current) return;

		if (messages.length > 0) {
			requestAnimationFrame(() => {
				scrollToBottom('auto');
				shouldScrollToBottomRef.current = false;
			});
		}
	}, [isLoading]);

	// Mark messages as read
	useEffect(() => {
		if (!chat?.chatId || messages.length === 0) return;

		const lastMessage = messages[messages.length - 1];

		if (lastMessage.senderId !== currentUserId) {
			markAsRead(lastMessage.messageId);
		}
	}, [chat?.chatId, messages.length, currentUserId]);

	const loadMessages = async () => {
		if (!chat?.chatId) return;

		setIsLoading(true);
		try {
			const msgs = await messageService.getChatMessages(
				chat.chatId,
				0,
				messagesSizeRef.current
			);
			setMessages(msgs.content);
			setHasMoreMessages(msgs.hasNext)


		} catch (error) {
			console.error('❌ Error loading messages:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const markAsRead = async (lastMessageId: string) => {
		if (!chat?.chatId) return;

		try {
			await messageService.markAsRead(chat.chatId, lastMessageId);
		} catch (error) {
			console.error('❌ Error marking as read:', error);
		}
	};

	const handleSendMessage = async (content: string) => {
		if (!chat?.chatId || !content.trim()) return;

		const trimmedContent = content.trim();

		try {
			sendWsMessage(trimmedContent, 'TEXT');

			requestAnimationFrame(() => {
				scrollToBottom();
			});
		} catch (error) {
			console.error('❌ WebSocket send failed:', error);
			try {
				const newMessage = await messageService.sendMessage(chat.chatId, {
					content: trimmedContent,
					type: 'TEXT'
				});

				setMessages(prev => {
					const exists = prev.some(msg => msg.messageId === newMessage.messageId);
					if (exists) return prev;
					return [...prev, newMessage];
				});

				requestAnimationFrame(() => {
					scrollToBottom();
				});
			} catch (restError) {
				console.error('❌ REST API also failed:', restError);
			}
		}
	};

	const handleTyping = (isTyping: boolean) => {
		sendTyping(isTyping);
	};

	const shouldShowNameAndAvatar = (index: number): boolean => {
		if (index === 0) return true;
		const current = messages[index];
		const prev = messages[index - 1];
		return current.senderId !== prev?.senderId;
	};

	const formatTypingUsers = (): string => {
		const users = [...typingUsers];

		if (users.length <= 1) return users[0] ?? "";
		if (users.length === 2) return `${users[0]} e ${users[1]}`;

		return `${users.slice(0, -1).join(", ")} e ${users.at(-1)}`;
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

			<div className={styles.messagesContainer} ref={containerRef}>
				{isLoading && (
					<div className={styles.loadingOverlay}>
						<Loader size={48} className={styles.spinner} />
						<p>A carregar mensagens...</p>
					</div>
				)}

				<div className={styles.messagesWrapper}>
					{isLoadingMore && (
						<div className={styles.loadingMore}>
							<Loader size={20} className={styles.spinner} />
							<span>A carregar mensagens antigas...</span>
						</div>
					)}

					{messages.length === 0 ? (
						<div className={styles.noMessages}>
							<MessageCircle size={48} strokeWidth={1.5} />
							<p>Nenhuma mensagem ainda</p>
							<span>Envia a primeira mensagem para começar a conversa</span>
						</div>
					) : (
						<>
							{messages.map((message, index) => {
								const hasSenderChanged =
									index > 0 &&
									messages[index - 1].senderId !== message.senderId

								return (
									<div
										key={message.messageId}
										className={hasSenderChanged ? `${styles.previousDifferent}` : `${styles.previousOwn}`}
									>
										<MessageBubble
											message={message}
											isOwn={message.senderId === currentUserId}
											showNameAndAvatar={shouldShowNameAndAvatar(index)}
										/>
									</div>
								)
							})}
							<div ref={messagesEndRef} />
						</>
					)}
				</div>

			</div>
			{typingUsers.size > 0 && (
				<div className={styles.typingIndicator}>
					<div className={styles.typingDots}>
						<span></span>
						<span></span>
						<span></span>
					</div>
					<span className={styles.typingText}>
						{formatTypingUsers()} {typingUsers.size === 1 ? 'está' : 'estão'} a escrever...
					</span>
				</div>
			)}

			{!isAtBottom && (
				<button
					className={styles.scrollToBottomBtn}
					onClick={() => scrollToBottom()}
					aria-label="Scroll to bottom"
				>
					<ArrowDown />
				</button>
			)}

			

			<MessageInput
				onSendMessage={handleSendMessage}
				onTyping={handleTyping}
			/>

			{/* Debug info*/}
			{/*import.meta.env.DEV && (
				<div style={{
					position: 'fixed',
					bottom: 10,
					right: 10,
					background: 'rgba(0,0,0,0.8)',
					color: 'white',
					padding: '8px',
					borderRadius: '4px',
					fontSize: '11px',
					zIndex: 9999
				}}>
					<div>Messages: {messages.length}</div>
					<div>Page: {currentPage}</div>
					<div>Has More: {hasMoreMessages ? 'Yes' : 'No'}</div>
					<div>At Bottom: {isAtBottom ? 'Yes' : 'No'}</div>
				</div>
			)*/}
		</div>
	);
}