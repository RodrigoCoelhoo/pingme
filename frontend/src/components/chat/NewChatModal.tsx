import { useState, useEffect, useCallback } from 'react';
import { X, Search, Users, User } from 'lucide-react';

import { ContactStatus, type ContactResponse } from '../../services/contact/contact.types';
import contactService from '../../services/contact/contact.service';

import styles from '../../styles/chat/NewChatModal.module.css';

import Avatar from '../Avatar';
import Input from '../Input';

import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { showError } from '../../utils/toast';

interface NewChatModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreatePrivateChat: (userId: string) => void;
	onCreateGroupChat: (memberIds: string[], groupName?: string) => void;
}

const LIMIT = 20;

export default function NewChatModal({
	isOpen,
	onClose,
	onCreatePrivateChat,
	onCreateGroupChat
}: NewChatModalProps) {
	const [contacts, setContacts] = useState<ContactResponse[]>([]);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

	const [groupName, setGroupName] = useState('');
	const [validity, setValidity] = useState({
		groupName: false
	});

	const isGroupChat = selectedContacts.size > 1;

	const isValid =
		selectedContacts.size === 1 ||
		(selectedContacts.size >= 2 && validity.groupName);

	const loadContacts = useCallback(async (
		pageToLoad: number,
		reset = false
	) => {
		if (isLoading) return;
		setIsLoading(true);

		try {
			const response = await contactService.getContacts(
				ContactStatus.ACCEPTED,
				pageToLoad,
				LIMIT,
				searchQuery
			);

			const newContacts = response.content;
			setContacts(prev => {
				if (reset) { return newContacts; }

				const existingIds = new Set(
					prev.map(contact => contact.userId)
				);

				const uniqueContacts = newContacts.filter(
					contact => !existingIds.has(contact.userId)
				);

				return [...prev, ...uniqueContacts];
			});

			setHasMore(newContacts.length === LIMIT);
			setPage(pageToLoad);
		} catch (error) {
			showError("There was an error loading contacts");
		} finally {
			setIsLoading(false);
		}
	}, [searchQuery, isLoading]);

	useEffect(() => {
		if (!isOpen) return;

		setContacts([]);
		setPage(0);
		setHasMore(true);

		loadContacts(0, true);
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		const timeout = setTimeout(() => {
			setContacts([]);
			setPage(0);
			setHasMore(true);

			loadContacts(0, true);
		}, 450);

		return () => clearTimeout(timeout);
	}, [searchQuery]);

	const handleLoadMore = useCallback(() => {
		if (isLoading || !hasMore) return;

		const nextPage = page + 1;
		loadContacts(nextPage);
	}, [page, isLoading, hasMore, loadContacts]);

	const { containerRef } = useInfiniteScroll(
		handleLoadMore,
		hasMore,
		isLoading
	);

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
			onCreateGroupChat(
				memberIds,
				groupName.trim()
			);
		}

		handleClose();
	};

	const handleClose = () => {
		setContacts([]);
		setSelectedContacts(new Set());

		setGroupName('');
		setSearchQuery('');

		setPage(0);
		setHasMore(true);

		onClose();
	};

	if (!isOpen) return null;

	return (
		<div
			className={styles.modalOverlay}
			onClick={handleClose}
		>
			<div
				className={styles.modalContent}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<div className={styles.modalTitle}>
						{isGroupChat
							? <Users size={24} />
							: <User size={24} />
						}
						<h2>
							{isGroupChat
								? 'Novo Grupo'
								: 'Nova Conversa'
							}
						</h2>
					</div>
					<button
						className={styles.closeBtn}
						onClick={handleClose}
					>
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
							onChange={(e) =>
								setSearchQuery(e.target.value)
							}
						/>
					</div>

					<hr className={styles.hr} />

					{selectedContacts.size > 0 && (
						<div>
							<div className={styles.selectedContacts}>
								<span className={styles.selectedCount}>
									{selectedContacts.size} selecionado
									{selectedContacts.size > 1 ? 's' : ''}
								</span>
							</div>
							{isGroupChat && (
								<div className={styles.groupNameInput}>
									<Input
										label="Nome do grupo"
										placeholder='Digite o nome do grupo'
										type="text"
										value={groupName}
										onChange={(e) =>
											setGroupName(e.target.value)
										}
										required
										onValidationChange={(isValid) =>
											setValidity(v => ({
												...v,
												groupName: isValid
											}))
										}
									/>
								</div>
							)}
						</div>
					)}

					<div
						className={styles.contactsList}
						ref={containerRef}
					>
						{contacts.length === 0 && isLoading ? (
							<div className={styles.loadingState}>
								A carregar contactos...
							</div>
						) :
							contacts.length === 0 ? (
								<div className={styles.emptyState}>
									Nenhum contacto encontrado
								</div>
							) : (
								contacts.map((contact) => (
									<div
										key={contact.userId}
										className={`${styles.contactItem} ${selectedContacts.has(contact.userId)
											? styles.selected
											: ''}`}
										onClick={() =>
											toggleContact(contact.userId)
										}
									>
										<Avatar
											name={contact.displayName}
											src={contact.avatarUrl}
										/>
										<div className={styles.contactInfo}>
											<h3>{contact.displayName}</h3>
											<span>{contact.username}</span>
										</div>
										<label className={styles.checkbox}>
											<input
												type="checkbox"
												checked={selectedContacts.has(contact.userId)}
												onChange={() => { }}
												className={styles.checkboxInput}
											/>
											<span className={styles.checkmark}></span>
										</label>
									</div>
								))
							)}

						{contacts.length > 0 && isLoading && (
							<div className={styles.loadingState}>
								A carregar mais contactos...
							</div>
						)}
					</div>
				</div>

				<div className={styles.modalFooter}>
					<button
						className={styles.btnSecondary}
						onClick={handleClose}
					>
						Cancelar
					</button>
					<button
						className={styles.btnPrimary}
						onClick={handleCreate}
						disabled={!isValid}
					>
						{isGroupChat
							? 'Criar Grupo'
							: 'Iniciar Conversa'
						}
					</button>
				</div>
			</div>
		</div>
	);
}