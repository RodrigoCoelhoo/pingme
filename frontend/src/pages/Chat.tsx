// pages/Chat.tsx
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
import { ChatType } from '../services/chat/chat.types';
import { showError } from '../utils/toast';

export default function Chat() {
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
		handleUpdateGroupName,
		handleUpdateGroupImage,
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
	} = useChats({ searchQuery: activeTab === 'chats' ? searchQuery : '' });

	// Contacts data with pagination - pass search query
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
		handleAddContact
	} = useContacts({ searchQuery: activeTab === 'contacts' ? searchQuery : '' });

	// Chat interactions - selecting chats, creating with UI updates
	const {
		handleActiveChatChange,
		handleCreatePrivateChatWithUI,
		handleCreateGroupChatWithUI,
	} = useChatInteractions({
		activeChat,
		isMobile,
		isSidebarOpen,
		setActiveChat,
		setIsSidebarOpen,
		setActiveTab,
		handleCreatePrivateChat,
		handleCreateGroupChat,
		insertChatSorted,
	});

	// Group actions with confirmations
	const groupActions = useGroupActions({
		onLeaveGroup: handleLeaveGroup,
		onDeleteGroup: handleDeleteGroup,
		onTransferOwnership: handleTransferOwnership,
		onKickMember: handleKickMember,
		onAddMembers: handleAddMembers,
		onUpdateGroupName: handleUpdateGroupName,
		onUpdateGroupImage: handleUpdateGroupImage,
		onPromoteMember: handlePromoteMember,
		onMuteChat: handleMuteChat,
		onSendContactRequest: handleSendContactRequest,
	});

	const handleDeleteChatWithConfirm = async (chatId: string) => {
		const chat: ChatType = chats.find(c => c.chatId === chatId)?.chatType || ChatType.GROUP;

		if (chat === ChatType.GROUP) {
			const confirmed = await groupActions.confirmation.confirm({
				title: 'Eliminar Conversa',
				message: 'Tens a certeza que queres eliminar esta conversa?',
				confirmText: 'Eliminar',
				cancelText: 'Cancelar',
				variant: 'danger'
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

	const handleAddContactWrapper = async (username: string) => {
		try {
			await handleAddContact(username);
		} catch (error) {
			showError('Erro ao adicionar contacto. Tenta novamente.');
		}
	};

	const activeChatData = chats.find(c => c.chatId === activeChat) || null;

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
				onStartChat={handleCreatePrivateChatWithUI}
				onDeleteChat={handleDeleteChatWithConfirm}
				onAcceptContact={handleAcceptContactWrapper}
				onRejectContact={handleRejectContactWrapper}
				onCancelRequest={handleCancelRequestWrapper}
			/>

			<div className={styles.chatMain}>
				<ChatWindow
					chat={activeChatData}
					setSidebarOpen={setIsSidebarOpen}
					onLeaveGroup={groupActions.handleLeaveGroup}
					onDeleteGroup={groupActions.handleDeleteGroup}
					onTransferOwnership={groupActions.handleTransferOwnership}
					onKickMember={groupActions.handleKickMember}
					onAddMembers={groupActions.handleAddMembers}
					onUpdateGroupName={groupActions.handleUpdateGroupName}
					onUpdateGroupImage={groupActions.handleUpdateGroupImage}
					onPromoteMember={groupActions.handlePromoteMember}
					onMuteChat={groupActions.handleMuteChat}
					onSendContactRequest={groupActions.handleSendContactRequest}
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