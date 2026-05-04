import { MoreVertical, ArrowLeft, Search } from 'lucide-react';
import { ChatType, type ChatPreview } from '../../services/chat/chatTypes';
import styles from '../../styles/chat/ChatHeader.module.css';
import { useEffect, useState } from 'react';
import Avatar from '../Avatar';

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

	return (
		<div className={styles.header}>
			<div>
				<button className={styles.backBtn} onClick={() => setSidebarOpen(true)}>
					<ArrowLeft size={24} />
				</button>
			</div>
			<div className={styles.info}>
				<Avatar name={chat.chatName} src={chat.chatImageUrl} size={isMobile ? 'sm' : 'md'} />

				<div className={styles.details}>
					<h3 className={styles.name}>{chat.chatName}</h3>
					{chat.chatType === ChatType.GROUP ? (
						<p className={styles.status}>View group details</p>
					) : (
						<p className={styles.status}>Online</p>
					)}
				</div>
			</div>

			<div className={styles.actions}>
				<button className={styles.actionBtn} title="Pesquisar na conversa">
					<Search size={20} />
				</button>
				<button className={styles.actionBtn} title="Mais opções">
					<MoreVertical size={20} />
				</button>
			</div>
		</div>
	);
};
