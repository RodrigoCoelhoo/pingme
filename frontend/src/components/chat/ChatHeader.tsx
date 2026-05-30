import { ArrowLeft, Bell, BellOff } from 'lucide-react';
import { ChatType, type ChatPreview, MemberRole, type UpdateChatRequest } from '../../services/chat/chat.types';
import styles from '../../styles/chat/ChatHeader.module.css';
import { useEffect, useState } from 'react';
import Avatar from '../Avatar';
import ChatDetailsModal from './ChatDetailsModal';
import AddMembersModal from './AddMembersModal';
import { formatLastSeen } from '../../utils/time';
import { useTranslation } from 'react-i18next';

interface ChatHeaderProps {
	chat: ChatPreview;
	isUserOnline: (userId: string) => boolean;
	setSidebarOpen: (open: boolean) => void;
	onLeaveGroup: () => void;
	onDeleteGroup: () => void;
	onTransferOwnership: (memberId: string) => void;
	onKickMember: (memberId: string) => void;
	onAddMembers: (chatId: string, memberIds: string[]) => void;
	onUpdateChat: (updates?: UpdateChatRequest, file?: File) => Promise<ChatPreview>;
	onPromoteMember: (memberId: string, newRole: MemberRole) => void;
	onMuteChat: () => void;
	onSendContactRequest: (memberUsername: string) => void;
}

export default function ChatHeader({
	chat,
	isUserOnline,
	setSidebarOpen,
	onLeaveGroup,
	onDeleteGroup,
	onTransferOwnership,
	onKickMember,
	onAddMembers,
	onUpdateChat,
	onPromoteMember,
	onMuteChat,
	onSendContactRequest
}: ChatHeaderProps) {
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	const [showGroupDetails, setShowGroupDetails] = useState<boolean>(false);
	const [showAddMembers, setShowAddMembers] = useState<boolean>(false);

	const { t } = useTranslation("chat");

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

	const online =
		chat?.otherUserId
			? isUserOnline(chat.otherUserId)
			: false;

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
						<p className={styles.status}>{t('headerDetails')}</p>
					) : (
						<p className={styles.status}>{online ? 'Online' : `${formatLastSeen(chat.otherUserLastSeenAt)}`}</p>
					)}
				</div>
			</button>

			<div className={styles.actions}>
				<button className={styles.actionBtn} title="Mute notifications" onClick={onMuteChat}>
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
					onUpdateChat={onUpdateChat}
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