import { Plus, Search, MessageSquare, Users } from 'lucide-react';
import styles from '../styles/Sidebar.module.css';
import type { ChatPreview } from '../services/chat/chat.types';
import type { ContactResponse } from '../services/contact/contact.types';
import ChatList from './chat/ChatList';
import ContactsList from './contact/ContactList';
import UserMenu from './UserMenu';
import { useTranslation } from 'react-i18next';

type SidebarTab = 'chats' | 'contacts';

type Props = {
	activeTab: SidebarTab;
	setActiveTab: (tab: SidebarTab) => void;

	// Chats
	chats: ChatPreview[];
	activeChat: string | null;
	setActiveChat: (chat: string | null) => void;
	isLoadingChats: boolean;
	chatsHasMore: boolean;
	onLoadMoreChats: () => void;

	// Accepted contacts
	acceptedContacts: ContactResponse[];
	isLoadingAccepted: boolean;
	acceptedHasMore: boolean;
	onLoadMoreAccepted: () => void;

	// Received pending contacts
	receivedPending: ContactResponse[];
	isLoadingReceivedPending: boolean;
	receivedPendingHasMore: boolean;
	onLoadMoreReceivedPending: () => void;

	// Sent pending contacts
	sentPending: ContactResponse[];
	isLoadingSentPending: boolean;
	sentPendingHasMore: boolean;
	onLoadMoreSentPending: () => void;

	// Search
	searchQuery: string;
	setSearchQuery: (q: string) => void;

	// UI
	isSidebarOpen: boolean;

	// Actions
	onOpenNewChat: () => void;
	onOpenAddContact: () => void;
	onStartChat: (userId: string) => void;
	onDeleteChat: (chatId: string) => void;
	onAcceptContact: (contactId: string) => void;
	onRejectContact: (contactId: string) => void;
	onCancelRequest: (contactId: string) => void;
	onDeleteContact: (contactId: string) => Promise<void>;
};

export default function Sidebar({
	activeTab,
	setActiveTab,
	chats,
	activeChat,
	setActiveChat,
	isLoadingChats,
	chatsHasMore,
	onLoadMoreChats,
	acceptedContacts,
	isLoadingAccepted,
	acceptedHasMore,
	onLoadMoreAccepted,
	receivedPending,
	isLoadingReceivedPending,
	receivedPendingHasMore,
	onLoadMoreReceivedPending,
	sentPending,
	isLoadingSentPending,
	sentPendingHasMore,
	onLoadMoreSentPending,
	searchQuery,
	setSearchQuery,
	isSidebarOpen,
	onOpenNewChat,
	onOpenAddContact,
	onStartChat,
	onDeleteChat,
	onAcceptContact,
	onRejectContact,
	onCancelRequest,
	onDeleteContact
}: Props) {
	const { t } = useTranslation("sidebar");
	
	return (
		<div className={`${styles.chatSidebar} ${isSidebarOpen ? styles.open : ''}`}>
			<div className={styles.sidebarHeader}>
				<div className={styles.sidebarTitle}>
					<h1>{activeTab === 'chats' ? t('chats.title') : t('contacts.title')}</h1>
				</div>

				<button
					className={styles.newChatBtn}
					onClick={activeTab === 'chats' ? onOpenNewChat : onOpenAddContact}
				>
					<Plus size={20} />
				</button>
			</div>

			<div className={styles.tabs}>
				<button
					className={`${styles.tab} ${activeTab === 'chats' ? styles.active : ''}`}
					onClick={() => setActiveTab('chats')}
				>
					<MessageSquare size={18} />
					<span>{t('chats.title')}</span>
				</button>

				<button
					className={`${styles.tab} ${activeTab === 'contacts' ? styles.active : ''}`}
					onClick={() => setActiveTab('contacts')}
				>
					<Users size={18} />
					<span>{t('contacts.title')}</span>
				</button>
			</div>

			<div className={styles.sidebarSearch}>
				<Search size={18} />
				<input
					type="text"
					placeholder={
						activeTab === 'chats'
							? t('chats.search')
							: t('contacts.search')
					}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			<div className={styles.sidebarContent}>
				{activeTab === 'chats' ? (
					<ChatList
						chats={chats}
						activeChat={activeChat}
						onChatSelect={setActiveChat}
						onDeleteChat={onDeleteChat}
						isLoading={isLoadingChats}
						hasMore={chatsHasMore}
						onLoadMore={onLoadMoreChats}
					/>
				) : (
					<ContactsList
						acceptedContacts={acceptedContacts}
						isLoadingAccepted={isLoadingAccepted}
						acceptedHasMore={acceptedHasMore}
						onLoadMoreAccepted={onLoadMoreAccepted}
						receivedPending={receivedPending}
						isLoadingReceivedPending={isLoadingReceivedPending}
						receivedPendingHasMore={receivedPendingHasMore}
						onLoadMoreReceivedPending={onLoadMoreReceivedPending}
						sentPending={sentPending}
						isLoadingSentPending={isLoadingSentPending}
						sentPendingHasMore={sentPendingHasMore}
						onLoadMoreSentPending={onLoadMoreSentPending}
						onStartChat={onStartChat}
						onDeleteContact={onDeleteContact}
						onAcceptContact={onAcceptContact}
						onRejectContact={onRejectContact}
						onCancelRequest={onCancelRequest}
					/>
				)}
			</div>

			<UserMenu />
		</div>
	);
}