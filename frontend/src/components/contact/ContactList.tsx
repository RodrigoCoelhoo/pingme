import { useState } from 'react';
import ContactListItem from './ContactListItem';
import PendingReceivedItem from './PendingReceivedItem';
import PendingSentItem from './PendingSentItem';
import styles from '../../styles/contact/ContactList.module.css';
import type { ContactResponse } from '../../services/contact/contact.types';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

type ContactTab = 'accepted' | 'received' | 'sent';

interface ContactsListProps {
	// Accepted contacts
	acceptedContacts: ContactResponse[];
	isLoadingAccepted: boolean;
	acceptedHasMore: boolean;
	onLoadMoreAccepted: () => void;

	// Received pending
	receivedPending: ContactResponse[];
	isLoadingReceivedPending: boolean;
	receivedPendingHasMore: boolean;
	onLoadMoreReceivedPending: () => void;

	// Sent pending
	sentPending: ContactResponse[];
	isLoadingSentPending: boolean;
	sentPendingHasMore: boolean;
	onLoadMoreSentPending: () => void;

	// Actions
	onStartChat: (userId: string) => void;
	onAcceptContact: (contactId: string) => void;
	onRejectContact: (contactId: string) => void;
	onCancelRequest: (contactId: string) => void;
	onDeleteContact: (contactId: string) => Promise<void>
}

export default function ContactsList({
	acceptedContacts,
	isLoadingAccepted,
	acceptedHasMore,
	onLoadMoreAccepted,
	receivedPending,
	isLoadingReceivedPending,
	receivedPendingHasMore,
	onLoadMoreReceivedPending,
	sentPending,
	isLoadingSentPending,
	sentPendingHasMore,
	onLoadMoreSentPending,
	onStartChat,
	onAcceptContact,
	onRejectContact,
	onCancelRequest,
	onDeleteContact
}: ContactsListProps) {
	const [activeTab, setActiveTab] = useState<ContactTab>('accepted');

	const { containerRef: acceptedRef } = useInfiniteScroll(
		onLoadMoreAccepted,
		acceptedHasMore,
		isLoadingAccepted,
		{ enabled: activeTab === 'accepted' }
	);

	const { containerRef: receivedRef } = useInfiniteScroll(
		onLoadMoreReceivedPending,
		receivedPendingHasMore,
		isLoadingReceivedPending,
		{ enabled: activeTab === 'received' }
	);

	const { containerRef: sentRef } = useInfiniteScroll(
		onLoadMoreSentPending,
		sentPendingHasMore,
		isLoadingSentPending,
		{ enabled: activeTab === 'sent' }
	);

	const renderTabContent = () => {
		switch (activeTab) {
			case 'accepted':
				return (
					<div ref={acceptedRef} className={styles.scrollContainer}>
						{acceptedContacts.length === 0 && !isLoadingAccepted ? (
							<div className={styles.empty}>
								<p>Nenhum contacto ainda</p>
								<span>Adiciona contactos para começar a conversar</span>
							</div>
						) : (
							<>
								{acceptedContacts.map((contact) => (
									<ContactListItem
										key={contact.contactId}
										contact={contact}
										onStartChat={onStartChat}
										onDeleteContact={onDeleteContact}
									/>
								))}
								{isLoadingAccepted && (
									<div className={styles.loading}>
										<div className={styles.spinner}></div>
										<span>A carregar mais contactos...</span>
									</div>
								)}
							</>
						)}
					</div>
				);

			case 'received':
				return (
					<div ref={receivedRef} className={styles.scrollContainer}>
						{receivedPending.length === 0 && !isLoadingReceivedPending ? (
							<div className={styles.empty}>
								<p>Nenhum pedido recebido</p>
								<span>Aqui aparecerão os pedidos de contacto que receberes</span>
							</div>
						) : (
							<>
								{receivedPending.map((contact) => (
									<PendingReceivedItem
										key={contact.contactId}
										contact={contact}
										onAccept={onAcceptContact}
										onReject={onRejectContact}
									/>
								))}
								{isLoadingReceivedPending && (
									<div className={styles.loading}>
										<div className={styles.spinner}></div>
										<span>A carregar mais pedidos...</span>
									</div>
								)}
							</>
						)}
					</div>
				);

			case 'sent':
				return (
					<div ref={sentRef} className={styles.scrollContainer}>
						{sentPending.length === 0 && !isLoadingSentPending ? (
							<div className={styles.empty}>
								<p>Nenhum pedido enviado</p>
								<span>Aqui aparecerão os pedidos de contacto que enviaste</span>
							</div>
						) : (
							<>
								{sentPending.map((contact) => (
									<PendingSentItem
										key={contact.contactId}
										contact={contact}
										onCancel={onCancelRequest}
									/>
								))}
								{isLoadingSentPending && (
									<div className={styles.loading}>
										<div className={styles.spinner}></div>
										<span>A carregar mais pedidos...</span>
									</div>
								)}
							</>
						)}
					</div>
				);
		}
	};

	const pendingReceivedCount = receivedPending.length;
	const pendingSentCount = sentPending.length;

	return (
		<div className={styles.list}>
			<div className={styles.tabs}>
				<button
					className={`${styles.tab} ${activeTab === 'accepted' ? styles.active : ''}`}
					onClick={() => setActiveTab('accepted')}
				>
					Contactos
				</button>
				<button
					className={`${styles.tab} ${activeTab === 'received' ? styles.active : ''}`}
					onClick={() => setActiveTab('received')}
				>
					Recebidos
					{pendingReceivedCount > 0 && (
						<span className={styles.badge}>{pendingReceivedCount}</span>
					)}
				</button>
				<button
					className={`${styles.tab} ${activeTab === 'sent' ? styles.active : ''}`}
					onClick={() => setActiveTab('sent')}
				>
					Enviados
					{pendingSentCount > 0 && (
						<span className={styles.badge}>{pendingSentCount}</span>
					)}
				</button>
			</div>

			{renderTabContent()}
		</div>
	);
}