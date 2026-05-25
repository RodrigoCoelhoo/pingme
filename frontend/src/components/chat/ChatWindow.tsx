import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Loader, ArrowDown } from 'lucide-react';
import type { MessageResponse } from '../../services/message/message.types';
import type { ChatPreview, UpdateChatRequest } from '../../services/chat/chat.types';
import { MemberRole } from '../../services/chat/chat.types';
import messageService from '../../services/message/message.service';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useAuth } from '../../contexts/AuthContext';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import styles from '../../styles/chat/ChatWindow.module.css';
import type { TypingIndicator } from '../../services/websocket/websocket.types';
import { showError } from '../../utils/toast';

interface ChatWindowProps {
	chat: ChatPreview | null;
	sendMessage: (content: string, type: 'TEXT' | 'IMAGE' | 'FILE') => void;
	sendTyping: (isTyping: boolean) => void;
	onRegisterMessageHandler: (fn: (msg: MessageResponse) => void) => void;
	onRegisterTypingHandler: (fn: (indicator: TypingIndicator) => void) => void;
	setSidebarOpen: (open: boolean) => void;
	onLeaveGroup: (chatId: string) => void;
	onDeleteGroup: (chatId: string) => void;
	onTransferOwnership: (chatId: string, memberId: string) => void;
	onKickMember: (chatId: string, memberId: string) => void;
	onAddMembers: (chatId: string, memberIds: string[]) => void;
	onUpdateChat: (chatId: string, data?: UpdateChatRequest, file?: File) => Promise<ChatPreview>;
	onPromoteMember: (chatId: string, memberId: string, newRole: MemberRole) => void;
	onMuteChat: (chatId: string) => void;
	onSendContactRequest: (memberUsername: string) => void;
}

export default function ChatWindow({
	chat,
	sendMessage: sendWsMessage,
	sendTyping,
	onRegisterMessageHandler,
	onRegisterTypingHandler,
	setSidebarOpen,
	onLeaveGroup,
	onDeleteGroup,
	onTransferOwnership,
	onKickMember,
	onAddMembers,
	onPromoteMember,
	onMuteChat,
	onSendContactRequest,
	onUpdateChat
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

		loadMessages().then((lastMessageId) => {
			if (lastMessageId) markAsRead(lastMessageId);
		});
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

	useEffect(() => {
		if (!chat?.chatId || messages.length === 0) return;

		const lastMessage = messages[messages.length - 1];
		markAsRead(lastMessage.messageId);
	}, [chat?.chatId, messages.length]);

	const loadMessages = async (): Promise<string | null> => {
		if (!chat?.chatId) return null;

		setIsLoading(true);
		try {
			const msgs = await messageService.getChatMessages(
				chat.chatId,
				0,
				messagesSizeRef.current
			);
			setMessages(msgs.content);
			setHasMoreMessages(msgs.hasNext)

			const last = msgs.content[msgs.content.length - 1];
			return last?.messageId ?? null;
		} catch (error) {
			console.error('❌ Error loading messages:', error);
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		onRegisterMessageHandler((message: MessageResponse) => {
			if (message.chatId !== chat?.chatId) return;

			setMessages(prev => {
				// Se já existe (por messageId), ignora
				if (prev.some(m => m.messageId === message.messageId)) return prev;

				// Se é uma mensagem de ficheiro do próprio user, substitui a primeira pending
				const isOwnFile =
					message.senderId === currentUserId &&
					(message.type === 'IMAGE' || message.type === 'FILE');

				if (isOwnFile) {
					const firstPendingIndex = prev.findIndex(m => m.pending);
					if (firstPendingIndex !== -1) {
						// Revoga o object URL para libertar memória
						const pending = prev[firstPendingIndex];
						if (pending.content?.startsWith('blob:')) {
							URL.revokeObjectURL(pending.content);
						}
						const updated = [...prev];
						updated[firstPendingIndex] = message;
						return updated;
					}
				}

				return [...prev, message];
			});

			if (isAtBottom) requestAnimationFrame(() => scrollToBottom());
		});
	}, [chat?.chatId, isAtBottom, scrollToBottom, onRegisterMessageHandler]);

	useEffect(() => {
		onRegisterTypingHandler((indicator: TypingIndicator) => {
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

			const existingTimeout = typingTimeoutsRef.current.get(indicator.userId);
			if (existingTimeout) clearTimeout(existingTimeout);

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
		});
	}, [chat?.chatId, currentUserId, onRegisterTypingHandler]);

	const markAsRead = async (lastMessageId: string) => {
		if (!chat?.chatId) return;

		try {
			await messageService.markAsRead(chat.chatId, lastMessageId);
		} catch (error) {
			console.error('❌ Error marking as read:', error);
		}
	};

	const handleSendMessage = async (content: string, files?: File[]) => {
		if (!chat?.chatId) return;
		if (!content.trim() && (!files || files.length === 0)) return;

		const trimmed = content.trim();

		// Texto via WebSocket (como estava)
		if (trimmed) {
			try {
				sendWsMessage(trimmed, 'TEXT');
			} catch (wsError) {
				console.error('❌ WebSocket failed, fallback REST:', wsError);
				try {
					const msg = await messageService.sendMessage(chat.chatId, {
						content: trimmed,
						type: 'TEXT'
					});
					setMessages(prev =>
						prev.some(m => m.messageId === msg.messageId) ? prev : [...prev, msg]
					);
				} catch (restError) {
					console.error('❌ REST also failed:', restError);
				}
			}
		}

		// Ficheiros via REST batch
		if (files && files.length > 0) {
			const validFiles = files.filter(file => file.size > 0);

			const emptyFiles = files.filter(file => file.size === 0);

			if (emptyFiles.length > 0) {
				showError('Não é possível enviar ficheiros vazios');
			}

			if (validFiles.length === 0) {
				return;
			}

			const pendingMessages: MessageResponse[] = validFiles.map(file => ({
				messageId: `pending-${file.name}-${Date.now()}-${Math.random()}`,
				chatId: chat.chatId,
				senderId: currentUserId,
				senderDisplayName: user?.displayName ?? '',
				senderAvatarUrl: user?.avatarUrl ?? '',
				content: file.type.startsWith('image/')
					? URL.createObjectURL(file)
					: file.name,
				type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
				createdAt: new Date().toISOString(),
				editedAt: null,
				deleted: false,
				pending: true,
				localId: file.name,
			}));

			// Adiciona imediatamente à lista
			setMessages(prev => [...prev, ...pendingMessages]);
			requestAnimationFrame(() => scrollToBottom());

			try {
				await messageService.sendFileMessages(chat.chatId, validFiles);
				// As mensagens reais chegam via WebSocket e substituem as pending
			} catch (error) {
				console.error('❌ File upload failed:', error);
				// Marca como falhadas
				setMessages(prev =>
					prev.map(m =>
						m.pending && pendingMessages.some(p => p.messageId === m.messageId)
							? { ...m, pending: false, failed: true }
							: m
					)
				);
			}
		}

		requestAnimationFrame(() => scrollToBottom());
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

	const handleRemoveFailedMessage = useCallback((messageId: string) => {
		setMessages(prev => prev.filter(m => m.messageId !== messageId));
	}, []);

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
				onUpdateChat={(data, file) => onUpdateChat(chat.chatId, data, file)}
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
											onRemoveFailed={handleRemoveFailedMessage}
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