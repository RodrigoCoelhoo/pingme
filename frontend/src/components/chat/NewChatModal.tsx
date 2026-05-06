import { useState, useEffect } from 'react';
import { X, Search, Users, User } from 'lucide-react';
import { ContactStatus, type ContactResponse } from '../../services/contact/contact.types';
import contactService from '../../services/contact/contact.service';
import styles from '../../styles/chat/NewChatModal.module.css';

interface NewChatModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreatePrivateChat: (userId: string) => void;
	onCreateGroupChat: (memberIds: string[], groupName?: string) => void;
}

export default function NewChatModal({ isOpen, onClose, onCreatePrivateChat, onCreateGroupChat }: NewChatModalProps) {
	const [contacts, setContacts] = useState<ContactResponse[]>([]);
	const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState('');
	const [groupName, setGroupName] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (isOpen) {
			loadContacts();
		}
	}, [isOpen]);

	const loadContacts = async () => {
		setIsLoading(true);
		try {
			const response = await contactService.getContacts(ContactStatus.ACCEPTED, 0, 100);
			setContacts(response.content);
		} catch (error) {
			console.error('Error loading contacts:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const toggleContact = (userId: string) => {
		const newSelected = new Set(selectedContacts);
		if (newSelected.has(userId)) {
			newSelected.delete(userId);
		} else {
			newSelected.add(userId);
		}
		setSelectedContacts(newSelected);
	};

	const handleCreate = () => {
		const memberIds = Array.from(selectedContacts);
		if (memberIds.length === 0) return;

		if (memberIds.length === 1) {
			onCreatePrivateChat(memberIds[0]);
		} else {
			onCreateGroupChat(memberIds, groupName || undefined);
		}

		handleClose();
	};

	const handleClose = () => {
		setSelectedContacts(new Set());
		setGroupName('');
		setSearchQuery('');
		onClose();
	};

	const filteredContacts = contacts.filter(contact =>
		contact.username.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const isGroupChat = selectedContacts.size > 1;

	if (!isOpen) return null;

	return (
		<div className={styles.modalOverlay} onClick={handleClose}>
			<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

				<div className={styles.modalHeader}>
					<div className={styles.modalTitle}>
						{isGroupChat ? <Users size={24} /> : <User size={24} />}
						<h2>{isGroupChat ? 'Novo Grupo' : 'Nova Conversa'}</h2>
					</div>
					<button className={styles.closeBtn} onClick={handleClose}>
						<X size={24} />
					</button>
				</div>

				<div className={styles.modalBody}>

					<div className={styles.searchBox}>
						<Search size={18} />
						<input
							type="text"
							placeholder="Procurar contactos..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					{isGroupChat && (
						<div className={styles.groupNameInput}>
							<input
								type="text"
								placeholder="Nome do grupo"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
							/>
						</div>
					)}

					{selectedContacts.size > 0 && (
						<div className={styles.selectedContacts}>
							<span className={styles.selectedCount}>
								{selectedContacts.size} selecionado{selectedContacts.size > 1 ? 's' : ''}
							</span>
						</div>
					)}

					<div className={styles.contactsList}>
						{isLoading ? (
							<div className={styles.loadingState}>A carregar contactos...</div>
						) : filteredContacts.length === 0 ? (
							<div className={styles.emptyState}>Nenhum contacto encontrado</div>
						) : (
							filteredContacts.map((contact) => (
								<div
									key={contact.userId}
									className={`${styles.contactItem} ${selectedContacts.has(contact.userId) ? styles.selected : ''
										}`}
									onClick={() => toggleContact(contact.userId)}
								>
									<div className={styles.contactAvatar}>
										{contact.avatarUrl ? (
											<img src={contact.avatarUrl} alt={contact.username} />
										) : (
											<div className={styles.contactAvatarPlaceholder}>
												{contact.username.charAt(0).toUpperCase()}
											</div>
										)}
									</div>

									<div className={styles.contactInfo}>
										<h4>{contact.username}</h4>
									</div>

									<div className={styles.checkbox}>
										<input
											type="checkbox"
											checked={selectedContacts.has(contact.userId)}
											onChange={() => { }}
										/>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				<div className={styles.modalFooter}>
					<button className={styles.btnSecondary} onClick={handleClose}>
						Cancelar
					</button>
					<button
						className={styles.btnPrimary}
						onClick={handleCreate}
						disabled={selectedContacts.size === 0}
					>
						{isGroupChat ? 'Criar Grupo' : 'Iniciar Conversa'}
					</button>
				</div>

			</div>
		</div>
	);
};
