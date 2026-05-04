import { useState, useEffect } from 'react';
import { type ChatPreview } from '../services/chat/chatTypes';
import chatService from '../services/chat/chatService';
import styles from '../styles/chat/Chat.module.css';
import { ContactStatus, type ContactResponse } from '../services/contact/contactTypes';
import contactService from '../services/contact/contactService';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/chat/NewChatModal';
import AddContactModal from '../components/contact/AddContactModal';
import Sidebar from '../components/Sidebar';

type SidebarTab = 'chats' | 'contacts';

export default function Chat() {
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
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		loadChats();
		loadContacts();
	}, []);

	useEffect(() => {
		setIsSidebarOpen(false);
	}, [activeChat]);

	useEffect(() => {
		if (!activeChat && isMobile) {
			setIsSidebarOpen(true);
		}
	}, [activeChat, isMobile]);

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

	return (
		<div className={styles.chatPage}>
			<Sidebar
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				chats={chats}
				contacts={contacts}
				activeChat={activeChat}
				setActiveChat={setActiveChat}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				isLoadingChats={isLoadingChats}
				isLoadingContacts={isLoadingContacts}
				isSidebarOpen={isSidebarOpen}
				onOpenNewChat={() => setIsNewChatModalOpen(true)}
				onOpenAddContact={() => setIsAddContactModalOpen(true)}
				onStartChat={handleCreatePrivateChat}
			/>

			<div className={styles.chatMain}>
				<ChatWindow
					chatId={activeChat}
					setSidebarOpen={setIsSidebarOpen}
				/>
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