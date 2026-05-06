import { ArrowLeft, Search, Bell, BellOff } from 'lucide-react';
import { ChatType, type ChatPreview } from '../../services/chat/chat.types';
import styles from '../../styles/chat/ChatHeader.module.css';
import { useEffect, useState } from 'react';
import Avatar from '../Avatar';
import ChatDetailsModal from './ChatDetailsModal';

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
		
	};

	const handleKickMember = (memberId: string) => {
		
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
					chat={chat}
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
