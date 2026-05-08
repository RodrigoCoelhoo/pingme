import styles from '../styles/chat/Chat.module.css';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/chat/NewChatModal';
import AddContactModal from '../components/contact/AddContactModal';
import Sidebar from '../components/Sidebar';
import { useChat } from '../hooks/useChat';
import { useChatUI } from '../hooks/useChatUI';
import { useGroupActions } from '../hooks/useGroupActions';
import { useChatInteractions } from '../hooks/useChatInteractions';

export default function Chat() {
	// Business logic - all chat data and operations
	const {
		chats,
		contacts,
		activeChat,
		setActiveChat,
		isLoadingChats,
		isLoadingContacts,
		activeChatData,
		handleCreatePrivateChat,
		handleCreateGroupChat,
		handleAddContact,
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

	// UI state - modals, sidebar, tabs
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
	});

	// Group actions - all group operations with confirmations/alerts
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

	return (
		<div className={styles.chatPage}>
			<Sidebar
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				chats={chats}
				contacts={contacts}
				activeChat={activeChat}
				setActiveChat={handleActiveChatChange}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				isLoadingChats={isLoadingChats}
				isLoadingContacts={isLoadingContacts}
				isSidebarOpen={isSidebarOpen}
				onOpenNewChat={openNewChatModal}
				onOpenAddContact={openAddContactModal}
				onStartChat={handleCreatePrivateChatWithUI}
				onDeleteChat={handleDeleteChat}
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
				onAddContact={handleAddContact}
			/>
		</div>
	);
}