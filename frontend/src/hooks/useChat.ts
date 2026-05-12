import { useState } from 'react';
import chatService from '../services/chat/chat.service';
import chatMemberService from '../services/chat/chatMember.service';
import contactService from '../services/contact/contact.service';
import { MemberRole, type ChatPreview } from '../services/chat/chat.types';

export function useChat() {
	const [activeChat, setActiveChat] = useState<ChatPreview | null>(null);

	const handleCreatePrivateChat = async (userId: string) => {
		try {
			const chat = await chatService.getOrCreatePrivateChat(userId);
			setActiveChat(chat);
			return chat;
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
			setActiveChat(chat);
			return chat;
		} catch (error) {
			console.error('Error creating group chat:', error);
			throw error;
		}
	};

	const handleDeleteChat = async (chatId: string) => {
		try {
			await chatMemberService.leaveChat(chatId);

			if (activeChat?.chatId === chatId) {
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

			if (activeChat?.chatId === chatId) {
				setActiveChat(null);
			}
		} catch (error) {
			console.error('Error leaving group:', error);
			throw error;
		}
	};

	const handleDeleteGroup = async (chatId: string) => {
		try {
			await chatService.deleteChat(chatId);

			if (activeChat?.chatId === chatId) {
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
			// Implement when API is ready
			// await chatService.updateChatName(chatId, newName);
		} catch (error) {
			console.error('Error updating group name:', error);
			throw error;
		}
	};

	const handleUpdateGroupImage = async (chatId: string, file: File) => {
		try {
			const formData = new FormData();
			formData.append('image', file);
			// Implement when API is ready
			// await chatService.updateChatImage(chatId, formData);
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

	return {
		activeChat,
		setActiveChat,

		// Chat actions
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
	};
}