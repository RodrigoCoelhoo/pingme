import React from 'react';
import { MessageCircle } from 'lucide-react';
import styles from '../../styles/contact/ContactListItem.module.css';
import type { ContactResponse } from '../../services/contact/contactTypes';

interface ContactListItemProps {
	contact: ContactResponse;
	onStartChat: (userId: string) => void;
}

const ContactListItem: React.FC<ContactListItemProps> = ({ contact, onStartChat }) => {
	return (
		<div className={styles.contactItem}>
			<div className={styles.avatar}>
				{contact.avatarUrl ? (
					<img src={contact.avatarUrl} alt={contact.username} />
				) : (
					<div className={styles.avatarPlaceholder}>
						{contact.username.charAt(0).toUpperCase()}
					</div>
				)}
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
		</div>
	);
};

export default ContactListItem;