import { useState, useEffect } from 'react';

type SidebarTab = 'chats' | 'contacts';

export function useChatUI() {
	const [activeTab, setActiveTab] = useState<SidebarTab>('chats');
	const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
	const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		setSearchQuery('');
	}, [activeTab]);

	const openNewChatModal = () => setIsNewChatModalOpen(true);
	const closeNewChatModal = () => setIsNewChatModalOpen(false);
	const openAddContactModal = () => setIsAddContactModalOpen(true);
	const closeAddContactModal = () => setIsAddContactModalOpen(false);
	const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
	const closeSidebar = () => setIsSidebarOpen(false);
	const openSidebar = () => setIsSidebarOpen(true);

	return {
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
		toggleSidebar,
		closeSidebar,
		openSidebar,
	};
}