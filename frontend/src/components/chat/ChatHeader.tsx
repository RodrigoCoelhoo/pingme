import { ArrowLeft, Search, Bell, BellOff } from 'lucide-react';
import { ChatType, type ChatPreview } from '../../services/chat/chatTypes';
import styles from '../../styles/chat/ChatHeader.module.css';
import { useEffect, useState } from 'react';
import Avatar from '../Avatar';
import ChatDetailsModal, { ContactStatus, MemberRole, type ChatDetails } from './ChatDetailsModal';

interface ChatHeaderProps {
	chat: ChatPreview;
	setSidebarOpen: (open: boolean) => void;
}

export default function ChatHeader({ chat, setSidebarOpen }: ChatHeaderProps) {
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const [showGroupDetails, setShowGroupDetails] = useState(false);

	const mockGroupDetails: ChatDetails = {
		id: 'group-123',
		name: 'Team Project Chat',
		imageUrl: 'https://i.pravatar.cc/150?img=1',
		currentUserRole: MemberRole.ADMIN,
		members: [
			{
				id: 'user-1',
				name: 'John Doe',
				avatarUrl: 'https://i.pravatar.cc/150?img=11',
				role: MemberRole.ADMIN,
				contactStatus: ContactStatus.ACCEPTED
			},
			{
				id: 'user-2',
				name: 'Jane Smith',
				avatarUrl: 'https://i.pravatar.cc/150?img=5',
				role: MemberRole.MODERATOR,
				contactStatus: ContactStatus.ACCEPTED
			},
			{
				id: 'user-3',
				name: 'Bob Johnson',
				avatarUrl: 'https://i.pravatar.cc/150?img=12',
				role: MemberRole.MEMBER,
				contactStatus: ContactStatus.PENDING
			},
			{
				id: 'user-4',
				name: 'Alice Williams',
				role: MemberRole.MEMBER,
				contactStatus: null // Show contact request button
			}
		]
	};

	const handleLeaveGroup = () => {
		console.log('Leaving group...');
		// Implement your leave group logic
		setShowGroupDetails(false);
	};

	const handleDeleteGroup = () => {
		if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
			console.log('Deleting group...');
			// Implement your delete group logic
			setShowGroupDetails(false);
		}
	};

	const handleTransferOwnership = (memberId: string) => {
		const member = mockGroupDetails.members.find(m => m.id === memberId);
		if (confirm(`Are you sure you want to transfer ownership to ${member?.name}?`)) {
			console.log('Transferring ownership to:', memberId);
			// Implement your transfer ownership logic
		}
	};

	const handleKickMember = (memberId: string) => {
		const member = mockGroupDetails.members.find(m => m.id === memberId);
		if (confirm(`Remove ${member?.name} from the group?`)) {
			console.log('Kicking member:', memberId);
			// Implement your kick member logic
		}
	};

	const handleAddMembers = () => {
		console.log('Opening add members dialog...');
		// Implement your add members logic
	};

	const handleUpdateGroupName = (name: string) => {
		console.log('Updating group name to:', name);
		// Implement your update group name logic
	};

	const handleUpdateGroupImage = (file: File) => {
		console.log('Updating group image:', file);
		// Implement your upload image logic
		// Example:
		// const formData = new FormData();
		// formData.append('image', file);
		// await uploadGroupImage(groupId, formData);
	};

	const handleChatMute = () => {
		chat.isMuted = !chat.isMuted;
	};

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
						<p className={styles.status}>View group details</p>
					) : (
						<p className={styles.status}>Online</p>
					)}
				</div>
			</button>

			<div className={styles.actions}>
				<button className={styles.actionBtn} title="Pesquisar na conversa">
					<Search size={20} />
				</button>
				<button className={styles.actionBtn} title="Mais opções" onClick={handleChatMute}>
					{chat.isMuted ? <BellOff size={20} /> : <Bell size={20} />}
				</button>
			</div>

			{showGroupDetails && (
				<ChatDetailsModal
					group={mockGroupDetails}
					onClose={() => setShowGroupDetails(false)}
					onLeaveGroup={handleLeaveGroup}
					onDeleteGroup={handleDeleteGroup}
					onTransferOwnership={handleTransferOwnership}
					onKickMember={handleKickMember}
					onAddMembers={handleAddMembers}
					onUpdateGroupName={handleUpdateGroupName}
					onUpdateGroupImage={handleUpdateGroupImage}
				/>
			)}
		</div>
	);
};
