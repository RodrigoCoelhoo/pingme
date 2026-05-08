import { MemberRole } from '../services/chat/chat.types';

interface UseGroupActionsProps {
	onLeaveGroup: (chatId: string) => Promise<void>;
	onDeleteGroup: (chatId: string) => Promise<void>;
	onTransferOwnership: (chatId: string, newOwnerId: string) => Promise<void>;
	onKickMember: (chatId: string, memberId: string) => Promise<void>;
	onAddMembers: (chatId: string, memberIds: string[]) => Promise<void>;
	onUpdateGroupName: (chatId: string, newName: string) => Promise<void>;
	onUpdateGroupImage: (chatId: string, file: File) => Promise<void>;
	onPromoteMember: (chatId: string, memberId: string, newRole: MemberRole) => Promise<void>;
	onMuteChat: (chatId: string) => Promise<void>;
	onSendContactRequest: (userId: string) => Promise<void>;
}

export function useGroupActions({
	onLeaveGroup,
	onDeleteGroup,
	onTransferOwnership,
	onKickMember,
	onAddMembers,
	onUpdateGroupName,
	onUpdateGroupImage,
	onPromoteMember,
	onMuteChat,
	onSendContactRequest,
}: UseGroupActionsProps) {

	const handleLeaveGroup = async (chatId: string) => {
		try {
			await onLeaveGroup(chatId);
		} catch (error) {
			alert('Erro ao sair do grupo. Tenta novamente.');
		}
	};

	const handleDeleteGroup = async (chatId: string) => {
		if (!confirm('Tens a certeza que queres eliminar este grupo? Esta ação não pode ser revertida.')) {
			return;
		}

		try {
			await onDeleteGroup(chatId);
		} catch (error) {
			alert('Erro ao eliminar o grupo. Tenta novamente.');
		}
	};

	const handleTransferOwnership = async (chatId: string, newOwnerId: string) => {
		if (!confirm('Tens a certeza que queres transferir a propriedade do grupo?')) {
			return;
		}

		try {
			await onTransferOwnership(chatId, newOwnerId);
			alert('Propriedade transferida com sucesso!');
		} catch (error) {
			alert('Erro ao transferir a propriedade. Tenta novamente.');
		}
	};

	const handleKickMember = async (chatId: string, memberId: string) => {
		if (!confirm('Tens a certeza que queres remover este membro?')) {
			return;
		}

		try {
			await onKickMember(chatId, memberId);
			alert('Membro removido com sucesso!');
		} catch (error) {
			alert('Erro ao remover o membro. Tenta novamente.');
		}
	};

	const handleAddMembers = async (chatId: string, memberIds: string[]) => {
		try {
			await onAddMembers(chatId, memberIds);
			alert('Membros adicionados com sucesso!');
		} catch (error) {
			alert('Erro ao adicionar membros. Tenta novamente.');
		}
	};

	const handleUpdateGroupName = async (chatId: string, newName: string) => {
		try {
			await onUpdateGroupName(chatId, newName);
			alert('Nome do grupo atualizado!');
		} catch (error) {
			alert('Erro ao atualizar o nome. Tenta novamente.');
		}
	};

	const handleUpdateGroupImage = async (chatId: string, file: File) => {
		try {
			await onUpdateGroupImage(chatId, file);
			alert('Imagem do grupo atualizada!');
		} catch (error) {
			alert('Erro ao atualizar a imagem. Tenta novamente.');
		}
	};

	const handlePromoteMember = async (chatId: string, memberId: string, newRole: MemberRole) => {
		try {
			await onPromoteMember(chatId, memberId, newRole);
			alert('Role atualizado com sucesso!');
		} catch (error) {
			alert('Erro ao atualizar o role. Tenta novamente.');
		}
	};

	const handleMuteChat = async (chatId: string) => {
		try {
			await onMuteChat(chatId);
		} catch (error) {
			alert('Erro ao silenciar o chat. Tenta novamente.');
		}
	};

	const handleSendContactRequest = async (userId: string) => {
		try {
			await onSendContactRequest(userId);
			alert('Pedido de contacto enviado!');
		} catch (error) {
			alert('Erro ao enviar pedido de contacto.');
		}
	};

	return {
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