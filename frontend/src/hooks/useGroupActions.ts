import { MemberRole, type ChatPreview } from '../services/chat/chat.types';
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
	onUpdateGroupName: (chatId: string, newName: string) => Promise<void>;
	onUpdateGroupImage: (chatId: string, file: File) => Promise<void>;
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
	onUpdateGroupName,
	onUpdateGroupImage,
	onPromoteMember,
	onMuteChat,
	onToggleMuteChat,
	onSendContactRequest,
}: UseGroupActionsProps) {
	const confirmation = useConfirmation();

	const handleLeaveGroup = async (chatId: string) => {
		const confirmed = await confirmation.confirm({
			title: 'Sair do Grupo',
			message: 'Tens a certeza que queres sair deste grupo?',
			confirmText: 'Sair',
			cancelText: 'Cancelar',
			variant: 'warning'
		});

		if (!confirmed) return;

		try {
			await onLeaveGroup(chatId);
		} catch (error) {
			showError('Erro ao sair do grupo. Tenta novamente.');
		}
	};

	const handleDeleteGroup = async (chatId: string) => {
		const confirmed = await confirmation.confirm({
			title: 'Eliminar Grupo',
			message: 'Tens a certeza que queres eliminar este grupo? Esta ação não pode ser revertida.',
			confirmText: 'Eliminar',
			cancelText: 'Cancelar',
			variant: 'danger'
		});

		if (!confirmed) return;

		try {
			await onDeleteGroup(chatId);
		} catch (error) {
			showError('Erro ao eliminar o grupo. Tenta novamente.');
		}
	};

	const handleTransferOwnership = async (chatId: string, newOwnerId: string) => {
		const confirmed = await confirmation.confirm({
			title: 'Transferir Propriedade',
			message: 'Tens a certeza que queres transferir a propriedade do grupo?',
			confirmText: 'Transferir',
			cancelText: 'Cancelar',
			variant: 'danger'
		});

		if (!confirmed) return;

		try {
			await onTransferOwnership(chatId, newOwnerId);

			onUpdateChat(chatId, {
				role: MemberRole.MODERATOR
			});

			showSuccess('Propriedade transferida com sucesso!');
		} catch (error) {
			showError('Erro ao transferir a propriedade. Tenta novamente.');
		}
	};

	const handleKickMember = async (chatId: string, memberId: string) => {
		try {
			await onKickMember(chatId, memberId);
		} catch (error) {
			showError('Erro ao remover o membro. Tenta novamente.');
		}
	};

	const handleAddMembers = async (chatId: string, memberIds: string[]) => {
		try {
			await onAddMembers(chatId, memberIds);
		} catch (error) {
			showError('Erro ao adicionar membros. Tenta novamente.');
		}
	};

	const handleUpdateGroupName = async (chatId: string, newName: string) => {
		try {
			await onUpdateGroupName(chatId, newName);
		} catch (error) {
			showError('Erro ao atualizar o nome. Tenta novamente.');
		}
	};

	const handleUpdateGroupImage = async (chatId: string, file: File) => {
		try {
			await onUpdateGroupImage(chatId, file);
		} catch (error) {
			showError('Erro ao atualizar a imagem. Tenta novamente.');
		}
	};

	const handlePromoteMember = async (chatId: string, memberId: string, newRole: MemberRole) => {
		try {
			await onPromoteMember(chatId, memberId, newRole);
		} catch (error) {
			showError('Erro ao atualizar o role. Tenta novamente.');
		}
	};

	const handleMuteChat = async (chatId: string) => {
		try {
			await onMuteChat(chatId);
			onToggleMuteChat(chatId);
		} catch (error) {
			showError('Erro ao silenciar o chat. Tenta novamente.');
		}
	};

	const handleSendContactRequest = async (username: string) : Promise<ContactResponse> => {
		try {
			const response = await onSendContactRequest(username);
			return response;
		} catch (error) {
			showError('Erro ao enviar pedido de contacto.');
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
		handleUpdateGroupName,
		handleUpdateGroupImage,
		handlePromoteMember,
		handleMuteChat,
		handleSendContactRequest,
	};
}