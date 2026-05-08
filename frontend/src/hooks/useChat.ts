import { useState, useEffect, useCallback } from 'react';
import { type ChatPreview } from '../services/chat/chat.types';
import chatService from '../services/chat/chat.service';
import { ContactStatus, type ContactResponse } from '../services/contact/contact.types';
import contactService from '../services/contact/contact.service';
import chatMemberService from '../services/chat/chatMember.service';
import { MemberRole } from '../services/chat/chat.types';

export function useChat() {
	const [chats, setChats] = useState<ChatPreview[]>([]);
	const [contacts, setContacts] = useState<ContactResponse[]>([]);
	const [activeChat, setActiveChat] = useState<string | null>(null);
	const [isLoadingChats, setIsLoadingChats] = useState(false);
	const [isLoadingContacts, setIsLoadingContacts] = useState(false);

	// Load initial data
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

	const insertChatSorted = useCallback((newChat: ChatPreview) => {
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
	}, []);

	const handleCreatePrivateChat = async (userId: string) => {
		try {
			const chat = await chatService.getOrCreatePrivateChat(userId);
			insertChatSorted(chat);
			setActiveChat(chat.chatId);
			return chat.chatId;
		} catch (error) {
			console.error('Error creating private chat:', error);
			throw error;
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
			return chat.chatId;
		} catch (error) {
			console.error('Error creating group chat:', error);
			throw error;
		}
	};

	const handleAddContact = async (username: string) => {
		await contactService.addContactByUsername(username);
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
			throw error;
		}
	};

	const handleLeaveGroup = async (chatId: string) => {
		try {
			await chatMemberService.leaveChat(chatId);

			setChats(prev => prev.filter(chat => chat.chatId !== chatId));

			if (activeChat === chatId) {
				setActiveChat(null);
			}
		} catch (error) {
			console.error('Error leaving group:', error);
			throw error;
		}
	};

	const handleDeleteGroup = async (chatId: string) => {
		try {
			// Assuming there's a deleteChat method in chatService
			// If not, use leaveChat or create the endpoint
			// await chatService.deleteChat?.(chatId);

			setChats(prev => prev.filter(chat => chat.chatId !== chatId));

			if (activeChat === chatId) {
				setActiveChat(null);
			}
		} catch (error) {
			console.error('Error deleting group:', error);
			throw error;
		}
	};

	const handleTransferOwnership = async (chatId: string, newOwnerId: string) => {
		try {
			await chatMemberService.updateRole(chatId, {
				userId: newOwnerId,
				role: MemberRole.ADMIN
			});

			// Update local chat to reflect role change
			setChats(prev => prev.map(chat => {
				if (chat.chatId === chatId) {
					return { ...chat, role: MemberRole.MODERATOR };
				}
				return chat;
			}));
		} catch (error) {
			console.error('Error transferring ownership:', error);
			throw error;
		}
	};

	const handleKickMember = async (chatId: string, memberId: string) => {
		try {
			await chatMemberService.kickMember(chatId, memberId);
		} catch (error) {
			console.error('Error kicking member:', error);
			throw error;
		}
	};

	const handleAddMembers = async (chatId: string, memberIds: string[]) => {
		try {
			await chatMemberService.addMembers(chatId, { memberIds });
		} catch (error) {
			console.error('Error adding members:', error);
			throw error;
		}
	};

	const handleUpdateGroupName = async (chatId: string, newName: string) => {
		try {
			// Assuming there's an updateChatName method in chatService
			// await chatService.updateChatName?.(chatId, newName);

			// Update locally
			setChats(prev => prev.map(chat =>
				chat.chatId === chatId ? { ...chat, chatName: newName } : chat
			));
		} catch (error) {
			console.error('Error updating group name:', error);
			throw error;
		}
	};

	const handleUpdateGroupImage = async (chatId: string, file: File) => {
		try {
			const formData = new FormData();
			formData.append('image', file);

			// Assuming there's an updateChatImage method in chatService
			// const updatedChat = await chatService.updateChatImage?.(chatId, formData);

			// Update locally
			// setChats(prev => prev.map(chat =>
			// 	chat.chatId === chatId ? { ...chat, chatImageUrl: updatedChat.chatImageUrl } : chat
			// ));
		} catch (error) {
			console.error('Error updating group image:', error);
			throw error;
		}
	};

	const handlePromoteMember = async (chatId: string, memberId: string, newRole: MemberRole) => {
		try {
			await chatMemberService.updateRole(chatId, {
				userId: memberId,
				role: newRole
			});
		} catch (error) {
			console.error('Error promoting member:', error);
			throw error;
		}
	};

	const handleMuteChat = async (chatId: string) => {
		try {
			await chatMemberService.muteChat(chatId);

			// Update locally
			setChats(prev => prev.map(chat =>
				chat.chatId === chatId ? { ...chat, muted: !chat.muted } : chat
			));
		} catch (error) {
			console.error('Error muting chat:', error);
			throw error;
		}
	};

	const handleSendContactRequest = async (userId: string) => {
		try {
			await contactService.addContactByUsername(userId);
		} catch (error) {
			console.error('Error sending contact request:', error);
			throw error;
		}
	};

	const activeChatData = chats.find(c => c.chatId === activeChat) || null;

	return {
		// State
		chats,
		contacts,
		activeChat,
		setActiveChat,
		isLoadingChats,
		isLoadingContacts,
		activeChatData,

		// Actions
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
	};
}