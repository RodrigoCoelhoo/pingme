import { useState, useEffect } from 'react';
import { type ChatPreview } from '../services/chat/chat.types';
import chatService from '../services/chat/chat.service';
import styles from '../styles/chat/Chat.module.css';
import { ContactStatus, type ContactResponse } from '../services/contact/contact.types';
import contactService from '../services/contact/contact.service';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/chat/NewChatModal';
import AddContactModal from '../components/contact/AddContactModal';
import Sidebar from '../components/Sidebar';
import chatMemberService from '../services/chat/chatMember.service';

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
			insertChatSorted(chat);
			setActiveChat(chat.chatId);
			setActiveTab('chats');
			setIsSidebarOpen(false);
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

			insertChatSorted(chat);
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

	const handleDeleteChat = async (chatId: string) => {
		try {
			await chatMemberService.leaveChat(chatId);

			setChats(prev => prev.filter(chat => chat.chatId !== chatId));

			if (activeChat === chatId) {
				setActiveChat(null);
			}
		} catch (error) {
			console.error('Error leaving chat:', error);
		}
	};

	const handleActiveChatChange = (chatId: string) => {
		setActiveChat(chatId);
		if (isMobile) {
			setIsSidebarOpen(false);
		}
	};

	const insertChatSorted = (newChat: ChatPreview) => {
		setChats(prev => {
			const exists = prev.some(c => c.chatId === newChat.chatId);
			if (exists) return prev;

			if (newChat.lastMessageTimestamp === null) return [newChat, ...prev];

			const updated = [newChat, ...prev];

			return updated.sort((a, b) => {
				if (!a.lastMessageTimestamp) return -1;
				if (!b.lastMessageTimestamp) return 1;

				return (
					new Date(b.lastMessageTimestamp).getTime() -
					new Date(a.lastMessageTimestamp).getTime()
				);
			});
		});
	};

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
				onOpenNewChat={() => setIsNewChatModalOpen(true)}
				onOpenAddContact={() => setIsAddContactModalOpen(true)}
				onStartChat={handleCreatePrivateChat}
				onDeleteChat={handleDeleteChat}
			/>

			<div className={styles.chatMain}>
				<ChatWindow
					chat={chats.find(c => c.chatId === activeChat) || null}
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