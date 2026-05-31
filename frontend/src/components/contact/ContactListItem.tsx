import { MessageCircle, UserMinus } from 'lucide-react';
import styles from '../../styles/contact/ContactListItem.module.css';
import type { ContactResponse } from '../../services/contact/contact.types';
import { useEffect, useState } from 'react';
import Avatar from '../Avatar';

interface ContactListItemProps {
	contact: ContactResponse;
	onStartChat: (userId: string) => void;
	onDeleteContact: (contactId: string) => Promise<void>
}

export default function ContactListItem({ contact, onStartChat, onDeleteContact }: ContactListItemProps) {
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);
	
	return (
		<div className={styles.contactItem}>
			<div className={styles.avatar}>
				<Avatar name={contact.displayName} src={contact.avatarUrl} size={isMobile ? 'sm' : 'md'} />
			</div>

			<div className={styles.info}>
				<h4 className={styles.displayName}>{contact.displayName}</h4>
				<p className={styles.username}>{contact.username}</p>
			</div>

			<button
				className={styles.chatBtn}
				onClick={() => onStartChat(contact.userId)}
				title="Iniciar conversa"
			>
				<MessageCircle size={18} />
			</button>

			<button
				className={styles.chatBtn}
				onClick={() => onDeleteContact(contact.contactId)}
				title="Eliminar contacto"
			>
				<UserMinus size={18} />
			</button>
		</div>
	);
};
