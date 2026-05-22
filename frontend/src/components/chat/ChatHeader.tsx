import { ArrowLeft, Search, Bell, BellOff } from 'lucide-react';
import { ChatType, type ChatPreview, MemberRole } from '../../services/chat/chat.types';
import styles from '../../styles/chat/ChatHeader.module.css';
import { useEffect, useState } from 'react';
import Avatar from '../Avatar';
import ChatDetailsModal from './ChatDetailsModal';
import AddMembersModal from './AddMembersModal';

interface ChatHeaderProps {
	chat: ChatPreview;
	setSidebarOpen: (open: boolean) => void;
	onLeaveGroup: () => void;
	onDeleteGroup: () => void;
	onTransferOwnership: (memberId: string) => void;
	onKickMember: (memberId: string) => void;
	onAddMembers: (chatId: string, memberIds: string[]) => void;
	onUpdateGroupName: (name: string) => void;
	onUpdateGroupImage: (file: File) => void;
	onPromoteMember: (memberId: string, newRole: MemberRole) => void;
	onMuteChat: () => void;
	onSendContactRequest: (memberUsername: string) => void;
}

export default function ChatHeader({
	chat,
	setSidebarOpen,
	onLeaveGroup,
	onDeleteGroup,
	onTransferOwnership,
	onKickMember,
	onAddMembers,
	onUpdateGroupName,
	onUpdateGroupImage,
	onPromoteMember,
	onMuteChat,
	onSendContactRequest
}: ChatHeaderProps) {
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	const [showGroupDetails, setShowGroupDetails] = useState<boolean>(false);
	const [showAddMembers, setShowAddMembers] = useState<boolean>(false);
	

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleLeaveGroup = () => {
		onLeaveGroup();
		setShowGroupDetails(false);
	};

	const handleDeleteGroup = () => {
		onDeleteGroup();
		setShowGroupDetails(false);
	};

	const handleAddMembersClick = (chatId: string, memberIds: string[]) => {
		onAddMembers(chatId, memberIds);
		setShowAddMembers(false);
	};

	const handleOpenAddMembers = () => {
		setShowGroupDetails(false);
		setShowAddMembers(true);
	}

	return (
		<div className={styles.header}>
			<div>
				<button className={styles.backBtn} onClick={() => setSidebarOpen(true)}>
					<ArrowLeft size={24} />
				</button>
			</div>
			<button
				className={`${styles.info} ${chat.chatType === ChatType.GROUP ? styles.clickable : styles.disabled}`}
				onClick={() => chat.chatType === ChatType.GROUP && setShowGroupDetails(true)}
				disabled={chat.chatType !== ChatType.GROUP}
			>
				<Avatar name={chat.chatName} src={chat.chatImageUrl} size={isMobile ? 'sm' : 'md'} />

				<div className={styles.details}>
					<h3 className={styles.name}>{chat.chatName}</h3>
					{chat.chatType === ChatType.GROUP ? (
						<p className={styles.status}>Ver detalhes do grupo</p>
					) : (
						<p className={styles.status}>Online</p>
					)}
				</div>
			</button>

			<div className={styles.actions}>
				<button className={styles.actionBtn} title="Pesquisar na conversa">
					<Search size={20} />
				</button>
				<button className={styles.actionBtn} title="Silenciar notificações" onClick={onMuteChat}>
					{chat.muted ? <BellOff size={20} /> : <Bell size={20} />}
				</button>
			</div>

			{showGroupDetails && (
				<ChatDetailsModal
					chat={chat}
					onClose={() => setShowGroupDetails(false)}
					onLeaveGroup={handleLeaveGroup}
					onDeleteGroup={handleDeleteGroup}
					onTransferOwnership={onTransferOwnership}
					onKickMember={onKickMember}
					onUpdateGroupName={onUpdateGroupName}
					onUpdateGroupImage={onUpdateGroupImage}
					onPromoteMember={onPromoteMember}
					onSendContactRequest={onSendContactRequest}
					onAddMembers={handleOpenAddMembers}
				/>
			)}

			{showAddMembers && (
				<AddMembersModal 
					chat={chat}
					isOpen={showAddMembers}
					onAddMembers={handleAddMembersClick}
					onClose={() => setShowAddMembers(false)}
				/>
			)}
		</div>
	);
}