import ContactListItem from './ContactListItem';
import styles from '../../styles/contact/ContactList.module.css';
import type { ContactResponse } from '../../services/contact/contact.types';

interface ContactsListProps {
	contacts: ContactResponse[];
	onStartChat: (userId: string) => void;
}

export default function ContactsList({ contacts, onStartChat }: ContactsListProps) {
	if (contacts.length === 0) {
		return (
			<div className={styles.empty}>
				<p>Nenhum contacto ainda</p>
				<span>Adiciona contactos para começar a conversar</span>
			</div>
		);
	}

	return (
		<div className={styles.list}>
			{contacts.map((contact) => (
				<ContactListItem
					key={contact.contactId}
					contact={contact}
					onStartChat={onStartChat}
				/>
			))}
		</div>
	);
};
