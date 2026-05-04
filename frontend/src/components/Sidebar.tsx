import { Plus, Search, MessageSquare, Users } from 'lucide-react';
import styles from '../styles/Sidebar.module.css';
import type { ChatPreview } from '../services/chat/chatTypes';
import type { ContactResponse } from '../services/contact/contactTypes';
import ChatList from './chat/ChatList';
import ContactsList from './contact/ContactList';
import UserMenu from './UserMenu';

type SidebarTab = 'chats' | 'contacts';

type Props = {
	activeTab: SidebarTab;
	setActiveTab: (tab: SidebarTab) => void;

	chats: ChatPreview[];
	contacts: ContactResponse[];

	activeChat: string | null;
	setActiveChat: (id: string) => void;

	searchQuery: string;
	setSearchQuery: (q: string) => void;

	isLoadingChats: boolean;
	isLoadingContacts: boolean;

	isSidebarOpen: boolean;

	onOpenNewChat: () => void;
	onOpenAddContact: () => void;

	onStartChat: (userId: string) => void;
};

export default function Sidebar({
	activeTab,
	setActiveTab,
	chats,
	contacts,
	activeChat,
	setActiveChat,
	searchQuery,
	setSearchQuery,
	isLoadingChats,
	isLoadingContacts,
	isSidebarOpen,
	onOpenNewChat,
	onOpenAddContact,
	onStartChat
}: Props) {
	const filteredChats = chats.filter(chat =>
		chat.chatName.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const filteredContacts = contacts.filter(contact =>
		contact.username.toLowerCase().includes(searchQuery.toLowerCase())
	);



	return (
		<div className={`${styles.chatSidebar} ${isSidebarOpen ? styles.open : ''}`}>
			<div className={styles.sidebarHeader}>
				<div className={styles.sidebarTitle}>
					<h1>{activeTab === 'chats' ? 'Conversas' : 'Contactos'}</h1>
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
					<span>Conversas</span>
				</button>

				<button
					className={`${styles.tab} ${activeTab === 'contacts' ? styles.active : ''}`}
					onClick={() => setActiveTab('contacts')}
				>
					<Users size={18} />
					<span>Contactos</span>
				</button>
			</div>

			<div className={styles.sidebarSearch}>
				<Search size={18} />
				<input
					type="text"
					placeholder={
						activeTab === 'chats'
							? 'Procurar conversas...'
							: 'Procurar contactos...'
					}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			<div className={styles.sidebarContent}>
				{activeTab === 'chats' ? (
					isLoadingChats ? (
						<div className={styles.loadingState}>
							<div className={styles.loadingSpinner}></div>
							<p>A carregar conversas...</p>
						</div>
					) : (
						<ChatList
							chats={filteredChats}
							activeChat={activeChat}
							onChatSelect={setActiveChat}
							onDeleteChat={(chatId) => console.log(chatId)}
						/>
					)
				) : isLoadingContacts ? (
					<div className={styles.loadingState}>
						<div className={styles.loadingSpinner}></div>
						<p>A carregar contactos...</p>
					</div>
				) : (
					<ContactsList
						contacts={filteredContacts}
						onStartChat={onStartChat}
					/>
				)}
			</div>

			<UserMenu />
		</div>
	);
}