import { useTranslation } from 'react-i18next';
import { MemberRole, type ChatPreview, type UpdateChatRequest } from '../services/chat/chat.types';
import type { ContactResponse } from '../services/contact/contact.types';
import { showError, showSuccess } from '../utils/toast';
import { useConfirmation } from './useConfirmation';

interface UseGroupActionsProps {
	onLeaveGroup: (chatId: string) => Promise<void>;
	onDeleteGroup: (chatId: string) => Promise<void>;
	onTransferOwnership: (chatId: string, newOwnerId: string) => Promise<void>;
	onUpdateChat: (chatId: string, updates: Partial<ChatPreview>) => void;
	onKickMember: (chatId: string, memberId: string) => Promise<void>;
	onAddMembers: (chatId: string, memberIds: string[]) => Promise<void>;
	onUpdateChatDetails: (chatId: string, data?: UpdateChatRequest, file?: File) => Promise<ChatPreview>;
	onPromoteMember: (chatId: string, memberId: string, newRole: MemberRole) => Promise<void>;
	onMuteChat: (chatId: string) => Promise<void>;
	onToggleMuteChat: (chatId: string) => void;
	onSendContactRequest: (memberUsername: string) => Promise<ContactResponse>;
}

export function useGroupActions({
	onLeaveGroup,
	onDeleteGroup,
	onTransferOwnership,
	onUpdateChat,
	onKickMember,
	onAddMembers,
	onUpdateChatDetails,
	onPromoteMember,
	onMuteChat,
	onToggleMuteChat,
	onSendContactRequest,
}: UseGroupActionsProps) {
	const confirmation = useConfirmation();

	const { t } = useTranslation("toast");

	const handleLeaveGroup = async (chatId: string) => {
		const confirmed = await confirmation.confirm({
			title: t('confirmation.leaveGroup.title'),
			message: t('confirmation.leaveGroup.message'),
			confirmText: t('confirmation.leaveGroup.confirm'),
			cancelText: t('confirmation.leaveGroup.cancel'),
			variant: 'warning'
		});

		if (!confirmed) return;

		try {
			await onLeaveGroup(chatId);
		} catch (error) {
			showError(t('actions.error', { action: t('actions.leave') }));
		}
	};

	const handleDeleteGroup = async (chatId: string) => {
		try {
			await onDeleteGroup(chatId);
		} catch (error) {
			showError(t('actions.error', { action: t('actions.delete') }));
		}
	};

	const handleTransferOwnership = async (chatId: string, newOwnerId: string) => {
		const confirmed = await confirmation.confirm({
			title: t('confirmation.transferOwnership.title'),
			message: t('confirmation.transferOwnership.message'),
			confirmText: t('confirmation.transferOwnership.confirm'),
			cancelText: t('confirmation.transferOwnership.cancel'),
			variant: 'danger'
		});

		if (!confirmed) return;

		try {
			await onTransferOwnership(chatId, newOwnerId);

			onUpdateChat(chatId, {
				role: MemberRole.MODERATOR
			});

			showSuccess(t('actions.success', { action: t('actions.transferSuccess') }));
		} catch (error) {
			showError(t('actions.error', { action: t('actions.transfer') }));
		}
	};

	const handleKickMember = async (chatId: string, memberId: string) => {
		try {
			await onKickMember(chatId, memberId);
		} catch (error) {
			showError(t('actions.error', { action: t('actions.kick') }));
		}
	};

	const handleAddMembers = async (chatId: string, memberIds: string[]) => {
		try {
			await onAddMembers(chatId, memberIds);
		} catch (error) {
			showError(t('actions.error', { action: t('actions.add') }));
		}
	};

	const handleUpdateChat = async (chatId: string, data?: UpdateChatRequest, file?: File) => {
		try {
			const updatedChat = await onUpdateChatDetails(chatId, data, file);

			onUpdateChat(chatId, updatedChat);

			return updatedChat;
		} catch (error) {
			showError(t('actions.error', { action: t('actions.update') }));
			throw error;
		}
	};

	const handlePromoteMember = async (chatId: string, memberId: string, newRole: MemberRole) => {
		try {
			await onPromoteMember(chatId, memberId, newRole);
		} catch (error) {
			showError(t('actions.error', { action: t('actions.role') }));
		}
	};

	const handleMuteChat = async (chatId: string) => {
		try {
			await onMuteChat(chatId);
			onToggleMuteChat(chatId);
		} catch (error) {
			showError(t('actions.error', { action: t('actions.mute') }));
		}
	};

	const handleSendContactRequest = async (username: string): Promise<ContactResponse> => {
		try {
			const response = await onSendContactRequest(username);
			return response;
		} catch (error) {
			showError(t('actions.error', { action: t('actions.contact') }));
			throw error;
		}
	};

	return {
		confirmation,
		handleLeaveGroup,
		handleDeleteGroup,
		handleTransferOwnership,
		handleKickMember,
		handleAddMembers,
		handleUpdateChat,
		handlePromoteMember,
		handleMuteChat,
		handleSendContactRequest,
	};
}