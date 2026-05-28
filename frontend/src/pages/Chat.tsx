import styles from '../styles/chat/Chat.module.css';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/chat/NewChatModal';
import AddContactModal from '../components/contact/AddContactModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Sidebar from '../components/Sidebar';
import { useChat } from '../hooks/useChat';
import { useChatUI } from '../hooks/useChatUI';
import { useGroupActions } from '../hooks/useGroupActions';
import { useChatInteractions } from '../hooks/useChatInteractions';
import { useContacts } from '../hooks/useContacts';
import { useChats } from '../hooks/useChats';
import { ChatEventType, ChatType, MemberRole, type ChatPreview } from '../services/chat/chat.types';
import { showError, showSuccess } from '../utils/toast';
import { useWebSocket } from '../hooks/useWebSocket';
import { useEffect, useRef, useState } from 'react';
import type { MessageResponse } from '../services/message/message.types';
import type { TypingIndicator } from '../services/websocket/websocket.types';
import chatService from '../services/chat/chat.service';
import { playNotificationSound } from '../utils/notification';
import contactService from '../services/contact/contact.service';

export default function Chat() {
	const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

	useEffect(() => {
		const loadOnlineUsers = async () => {
			try {
				const users = await contactService.getOnlineContacts();
				setOnlineUsers(new Set(users));
			} catch (err) {
				console.error(err);
			}
		};

		loadOnlineUsers();
	}, []);

	// UI state - modals, sidebar, tabs, search
	const {
		activeTab,
		setActiveTab,
		isNewChatModalOpen,
		isAddContactModalOpen,
		searchQuery,
		setSearchQuery,
		isSidebarOpen,
		setIsSidebarOpen,
		isMobile,
		openNewChatModal,
		closeNewChatModal,
		openAddContactModal,
		closeAddContactModal,
	} = useChatUI();

	// Business logic - chat operations
	const {
		activeChat,
		setActiveChat,
		handleCreatePrivateChat,
		handleCreateGroupChat,
		handleDeleteChat,
		handleLeaveGroup,
		handleDeleteGroup,
		handleTransferOwnership,
		handleKickMember,
		handleAddMembers,
		handleUpdateChat,
		handlePromoteMember,
		handleMuteChat,
		handleSendContactRequest,
	} = useChat();

	// Chats data with pagination - pass search query
	const {
		chats,
		isLoading: isLoadingChats,
		hasMore: chatsHasMore,
		loadMore: loadMoreChats,
		insertChatSorted,
		removeChat,
		updateChat,
		toggleMuteChat,
		updateChatsByUserId
	} = useChats({ searchQuery: activeTab === 'chats' ? searchQuery : '' });

	const token = localStorage.getItem('accessToken');
	const activeChatTypingRef = useRef<((indicator: TypingIndicator) => void) | null>(null);
	const activeChatEditRef = useRef<((messageId: string, content: string, editedAt: string) => void) | null>(null);
	const activeChatDeleteRef = useRef<((messageId: string) => void) | null>(null);

	const { sendMessage, sendTyping } = useWebSocket({
		chatId: activeChat ?? null,
		token,
		onMessageReceived: async (message) => {
			const existingChat = chats.find(c => c.chatId === message.chatId);

			const isActiveChat = message.chatId === activeChat;
			const isMuted = existingChat?.muted ?? false;

			if (existingChat) {
				updateChat(
					message.chatId,
					{
						lastMessage: message.content,
						lastMessageTimestamp: message.createdAt,
						lastMessageId: message.messageId,
						lastMessageDeleted: message.deleted,
						unreadCount: isActiveChat
							? 0
							: isMuted
								? 0
								: (existingChat.unreadCount ?? 0) + 1
					},
					true
				);
			} else {
				try {
					const fetchedChat = await chatService.getChatById(message.chatId);

					insertChatSorted({
						...fetchedChat,
						lastMessage: message.content,
						lastMessageTimestamp: message.createdAt,
						lastMessageId: message.messageId,
						lastMessageDeleted: message.deleted,
						unreadCount: fetchedChat.muted ? 0 : fetchedChat.unreadCount
					});
				} catch (error) {
					console.error('❌ Failed to fetch unknown chat:', error);
				}
			}

			// 🔇 sound rules
			const shouldPlaySound =
				!isMuted && !isActiveChat;

			if (shouldPlaySound) {
				playNotificationSound();
			}

			activeChatMessageRef.current?.(message);
		},
		onTypingReceived: (indicator) => {
			activeChatTypingRef.current?.(indicator);
		},
		onEventReceived: (event) => {
			const exists = chats.find(c => c.chatId === event.chatId);

			switch (event.type) {
				case ChatEventType.MEMBER_KICKED:
				case ChatEventType.CHAT_DELETED:
					removeChat(event.chatId);
					if (activeChat === event.chatId) {
						setActiveChat(null);
					}
					break;

				case ChatEventType.MEMBER_ROLE_UPDATED:
					if (exists) {
						updateChat(event.chatId, { role: event.payload as MemberRole });
					}
					break;

				case ChatEventType.MEMBER_ADDED:
				case ChatEventType.CHAT_CREATED:
					if (!exists) {
						insertChatSorted(event.payload as ChatPreview);
					}
					break;

				case ChatEventType.DETAILS_UPDATED:
					if (exists) {
						updateChat(event.chatId, event.payload as Partial<ChatPreview>);
					}
					break;
				case ChatEventType.MESSAGE_EDITED:
					if (event.payload.messageId === chats.find(c => c.chatId === event.chatId)?.lastMessageId) {
						updateChat(event.chatId, {
							lastMessageId: event.payload.messageId,
							lastMessage: event.payload.content,
							lastMessageTimestamp: event.payload.editedAt
						}, false);
					}

					if (event.chatId !== activeChat) break;
					activeChatEditRef.current?.(event.payload.messageId, event.payload.content, event.payload.editedAt);
					break;

				case ChatEventType.MESSAGE_DELETED:
					if (event.payload.messageId === chats.find(c => c.chatId === event.chatId)?.lastMessageId) {
						updateChat(event.chatId, {
							lastMessageId: event.payload.messageId,
							lastMessage: event.payload.content,
							lastMessageDeleted: event.payload.deleted
						}, false);
					}

					if (event.chatId !== activeChat) break;
					activeChatDeleteRef.current?.(event.payload.messageId);
					break;
			}
		},
		onPresenceReceived: (event) => {

			if (event.status === 'ONLINE') {

				setOnlineUsers(prev => {
					const next = new Set(prev);
					next.add(event.userId);
					return next;
				});

				return;
			}

			setOnlineUsers(prev => {
				const next = new Set(prev);
				next.delete(event.userId);
				return next;
			});

			updateChatsByUserId(
				event.userId,
				{
					otherUserLastSeenAt: event.lastSeenAt
				}
			);
		},
		enabled: !!token
	});

	const activeChatMessageRef = useRef<((msg: MessageResponse) => void) | null>(null);

	const {
		acceptedContacts,
		isLoadingAccepted,
		acceptedHasMore,
		loadMoreAccepted,
		receivedPending,
		isLoadingReceivedPending,
		receivedPendingHasMore,
		loadMoreReceivedPending,
		sentPending,
		isLoadingSentPending,
		sentPendingHasMore,
		loadMoreSentPending,
		handleAcceptContact,
		handleRejectContact,
		handleCancelRequest,
		handleAddContact,
		handleDeleteContact,
		addSentPendingContact
	} = useContacts({ searchQuery: activeTab === 'contacts' ? searchQuery : '' });

	const {
		handleActiveChatChange,
		handleCreatePrivateChatWithUI,
		handleCreateGroupChatWithUI,
	} = useChatInteractions({
		activeChat,
		setActiveChat,
		isMobile,
		setIsSidebarOpen,
		setActiveTab,
		handleCreatePrivateChat,
		handleCreateGroupChat,
		insertChatSorted,
		updateChat,
	});

	const groupActions = useGroupActions({
		onLeaveGroup: handleLeaveGroup,
		onDeleteGroup: handleDeleteGroup,
		onTransferOwnership: handleTransferOwnership,
		onUpdateChat: updateChat,
		onKickMember: handleKickMember,
		onAddMembers: handleAddMembers,
		onUpdateChatDetails: handleUpdateChat,
		onPromoteMember: handlePromoteMember,
		onMuteChat: handleMuteChat,
		onToggleMuteChat: toggleMuteChat,
		onSendContactRequest: handleSendContactRequest,
	});

	const handleDeleteChatWithConfirm = async (chatId: string) => {
		const chat: ChatType = chats.find(c => c.chatId === chatId)?.chatType || ChatType.GROUP;

		if (chat === ChatType.GROUP) {
			const confirmed = await groupActions.confirmation.confirm({
				title: 'Sair do grupo',
				message: 'Tens a certeza que queres sair deste grupo?',
				confirmText: 'Sair',
				cancelText: 'Cancelar',
				variant: 'warning'
			});

			if (!confirmed) return;
		}

		try {
			await handleDeleteChat(chatId);
			removeChat(chatId);
		} catch (error) {
			showError('Erro ao eliminar conversa. Tenta novamente.');
		}
	};

	const handleAcceptContactWrapper = async (contactId: string) => {
		try {
			await handleAcceptContact(contactId);
		} catch (error) {
			showError('Erro ao aceitar contacto. Tenta novamente.');
		}
	};

	const handleRejectContactWrapper = async (contactId: string) => {
		try {
			await handleRejectContact(contactId);
		} catch (error) {
			showError('Erro ao rejeitar contacto. Tenta novamente.');
		}
	};

	const handleCancelRequestWrapper = async (contactId: string) => {
		try {
			await handleCancelRequest(contactId);
		} catch (error) {
			showError('Erro ao cancelar pedido. Tenta novamente.');
		}
	};

	const handleAddContactWrapper = async (username: string): Promise<boolean> => {
		try {
			await handleAddContact(username);
			showSuccess('Contacto adicionado com sucesso!')
			return true;
		} catch (error) {
			showError('Erro ao adicionar contacto. Tenta novamente.');
			return false;
		}
	};

	const handleDeleteContactWrapper = async (contactId: string) => {
		try {
			const confirmed = await groupActions.confirmation.confirm({
				title: 'Eliminar contacto',
				message: 'Tens a certeza que queres eliminar este contacto?',
				confirmText: 'Eliminar',
				cancelText: 'Cancelar',
				variant: 'danger'
			});

			if (!confirmed) return;

			await handleDeleteContact(contactId);
		} catch (error) {
			showError('Erro ao remover contacto. Tenta novamente.');
		}
	};

	const handleDeleteGroupWithUI = async (chatId: string) => {
		try {
			await groupActions.handleDeleteGroup(chatId);
			removeChat(chatId);

			if (activeChat === chatId) {
				setActiveChat(null);
			}

			showSuccess('Grupo eliminado com sucesso!');
		} catch (error) {
			showError('Erro ao eliminar grupo. Tenta novamente.');
		}
	};

	const handleSendContactRequestWithUI = async (username: string) => {
		try {
			const newContact = await groupActions.handleSendContactRequest(username);
			addSentPendingContact(newContact);

			showSuccess('Pedido enviado com sucesso!');
		} catch (error) {
			// already handled
		}
	};

	const activeChatPreview = chats.find(c => c.chatId === activeChat) ?? null;

	return (
		<div className={styles.chatPage}>
			<Sidebar
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				chats={chats}
				activeChat={activeChat}
				setActiveChat={handleActiveChatChange}
				isLoadingChats={isLoadingChats}
				chatsHasMore={chatsHasMore}
				onLoadMoreChats={loadMoreChats}
				acceptedContacts={acceptedContacts}
				isLoadingAccepted={isLoadingAccepted}
				acceptedHasMore={acceptedHasMore}
				onLoadMoreAccepted={loadMoreAccepted}
				receivedPending={receivedPending}
				isLoadingReceivedPending={isLoadingReceivedPending}
				receivedPendingHasMore={receivedPendingHasMore}
				onLoadMoreReceivedPending={loadMoreReceivedPending}
				sentPending={sentPending}
				isLoadingSentPending={isLoadingSentPending}
				sentPendingHasMore={sentPendingHasMore}
				onLoadMoreSentPending={loadMoreSentPending}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				isSidebarOpen={isSidebarOpen}
				onOpenNewChat={openNewChatModal}
				onOpenAddContact={openAddContactModal}
				onDeleteContact={handleDeleteContactWrapper}
				onStartChat={handleCreatePrivateChatWithUI}
				onDeleteChat={handleDeleteChatWithConfirm}
				onAcceptContact={handleAcceptContactWrapper}
				onRejectContact={handleRejectContactWrapper}
				onCancelRequest={handleCancelRequestWrapper}
			/>

			<div className={styles.chatMain}>
				<ChatWindow
					chat={activeChatPreview}
					isUserOnline={(userId: string) => onlineUsers.has(userId)}
					sendMessage={sendMessage}
					sendTyping={sendTyping}
					onRegisterMessageHandler={(fn) => { activeChatMessageRef.current = fn; }}
					onRegisterTypingHandler={(fn) => { activeChatTypingRef.current = fn; }}
					setSidebarOpen={setIsSidebarOpen}
					onLeaveGroup={groupActions.handleLeaveGroup}
					onDeleteGroup={handleDeleteGroupWithUI}
					onTransferOwnership={groupActions.handleTransferOwnership}
					onKickMember={groupActions.handleKickMember}
					onAddMembers={groupActions.handleAddMembers}
					onUpdateChat={groupActions.handleUpdateChat}
					onPromoteMember={groupActions.handlePromoteMember}
					onMuteChat={groupActions.handleMuteChat}
					onSendContactRequest={handleSendContactRequestWithUI}
					onRegisterEditHandler={(fn) => { activeChatEditRef.current = fn; }}
					onRegisterDeleteHandler={(fn) => { activeChatDeleteRef.current = fn; }}
				/>
			</div>

			<NewChatModal
				isOpen={isNewChatModalOpen}
				onClose={closeNewChatModal}
				onCreatePrivateChat={handleCreatePrivateChatWithUI}
				onCreateGroupChat={handleCreateGroupChatWithUI}
			/>

			<AddContactModal
				isOpen={isAddContactModalOpen}
				onClose={closeAddContactModal}
				onAddContact={handleAddContactWrapper}
			/>

			<ConfirmationModal
				isOpen={groupActions.confirmation.isOpen}
				config={groupActions.confirmation.config}
				onConfirm={groupActions.confirmation.handleConfirm}
				onCancel={groupActions.confirmation.handleCancel}
			/>
		</div>
	);
}