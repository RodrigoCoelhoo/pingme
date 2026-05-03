import React, { useState, useEffect } from 'react';
import { Plus, Search, Menu, X, MessageSquare, Users } from 'lucide-react';
import { ChatType, type ChatPreview } from '../services/chat/chatTypes';
import chatService from '../services/chat/chatService';
import styles from '../styles/chat/Chat.module.css';
import { ContactStatus, type ContactResponse } from '../services/contact/contactTypes';
import contactService from '../services/contact/contactService';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/chat/NewChatModal';
import AddContactModal from '../components/contact/AddContactModal';
import ContactsList from '../components/contact/ContactList';

type SidebarTab = 'chats' | 'contacts';

const Chat: React.FC = () => {
	const [activeTab, setActiveTab] = useState<SidebarTab>('chats');
	const [chats, setChats] = useState<ChatPreview[]>([]);
	const [contacts, setContacts] = useState<ContactResponse[]>([]);
	const [activeChat, setActiveChat] = useState<string | null>(null);
	const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
	const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [isLoadingChats, setIsLoadingChats] = useState(false);
	const [isLoadingContacts, setIsLoadingContacts] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	useEffect(() => {
		loadChats();
		loadContacts();
	}, []);

	const loadChats = async () => {
		setIsLoadingChats(true);
		try {
			const data = await chatService.getMyChats();
			setChats(data);
		} catch (error) {
			console.error('Error loading chats:', error);
		} finally {
			setIsLoadingChats(false);
		}
	};

	const loadContacts = async () => {
		setIsLoadingContacts(true);
		try {
			const response = await contactService.getContacts(ContactStatus.ACCEPTED);
			setContacts(response.content);
		} catch (error) {
			console.error('Error loading contacts:', error);
		} finally {
			setIsLoadingContacts(false);
		}
	};

	const handleCreatePrivateChat = async (userId: string) => {
		try {
			const chat = await chatService.getOrCreatePrivateChat(userId);
			setChats(prev => {
				const exists = prev.some(c => c.chatId === chat.chatId);
				return exists ? prev : [chat, ...prev];
			});
			setActiveChat(chat.chatId);
			setActiveTab('chats');
		} catch (error) {
			console.error('Error creating private chat:', error);
		}
	};

	const handleCreateGroupChat = async (memberIds: string[], groupName?: string) => {
		try {
			const chat = await chatService.createGroupChat({
				membersIds: memberIds,
				chatName: groupName
			});
			await loadChats();
			setActiveChat(chat.chatId);
		} catch (error) {
			console.error('Error creating group chat:', error);
		}
	};

	const handleAddContact = async (username: string) => {
		await contactService.addContactByUsername(username);
		// Optionally reload contacts to show pending status
		await loadContacts();
	};

	const filteredChats = chats.filter(chat =>
		chat.chatName.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const filteredContacts = contacts.filter(contact =>
		contact.username.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className={styles.chatPage}>
			<div className={`${styles.chatSidebar} ${isSidebarOpen ? styles.open : ''}`}>
				<div className={styles.sidebarHeader}>
					<div className={styles.sidebarTitle}>
						<h1>{activeTab === 'chats' ? 'Conversas' : 'Contactos'}</h1>
						<button
							className={styles.mobileToggle}
							onClick={() => setIsSidebarOpen(false)}
						>
							<X size={24} />
						</button>
					</div>

					<button
						className={styles.newChatBtn}
						onClick={() => activeTab === 'chats' ? setIsNewChatModalOpen(true) : setIsAddContactModalOpen(true)}
						title={activeTab === 'chats' ? 'Nova conversa' : 'Adicionar contacto'}
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
						placeholder={activeTab === 'chats' ? 'Procurar conversas...' : 'Procurar contactos...'}
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
								onDeleteChat={(chatId) => console.log('Delete chat:', chatId)}
							/>
						)
					) : (
						isLoadingContacts ? (
							<div className={styles.loadingState}>
								<div className={styles.loadingSpinner}></div>
								<p>A carregar contactos...</p>
							</div>
						) : (
							<ContactsList
								contacts={filteredContacts}
								onStartChat={handleCreatePrivateChat}
							/>
						)
					)}
				</div>
			</div>

			<div className={styles.chatMain}>
				<button
					className={styles.mobileMenuBtn}
					onClick={() => setIsSidebarOpen(true)}
				>
					<Menu size={24} />
				</button>

				<ChatWindow chatId={activeChat} />
			</div>

			<NewChatModal
				isOpen={isNewChatModalOpen}
				onClose={() => setIsNewChatModalOpen(false)}
				onCreatePrivateChat={handleCreatePrivateChat}
				onCreateGroupChat={handleCreateGroupChat}
			/>

			<AddContactModal
				isOpen={isAddContactModalOpen}
				onClose={() => setIsAddContactModalOpen(false)}
				onAddContact={handleAddContact}
			/>
		</div>
	);
};

export default Chat;