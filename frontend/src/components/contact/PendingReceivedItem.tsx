import { Check, X } from 'lucide-react';
import styles from '../../styles/contact/PendingReceivedItem.module.css';
import type { ContactResponse } from '../../services/contact/contact.types';
import { useEffect, useState } from 'react';
import Avatar from '../Avatar';

interface PendingReceivedItemProps {
	contact: ContactResponse;
	onAccept: (contactId: string) => void;
	onReject: (contactId: string) => void;
}

export default function PendingReceivedItem({ contact, onAccept, onReject }: PendingReceivedItemProps) {
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleAccept = async () => {
		setIsProcessing(true);
		try {
			await onAccept(contact.contactId);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleReject = async () => {
		setIsProcessing(true);
		try {
			await onReject(contact.contactId);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className={styles.pendingItem}>
			<div className={styles.avatar}>
				<Avatar name={contact.displayName} src={contact.avatarUrl} size={isMobile ? 'sm' : 'md'} />
			</div>

			<div className={styles.info}>
				<h4 className={styles.displayName}>{contact.displayName}</h4>
				<p className={styles.username}>{contact.username}</p>
			</div>

			<div className={styles.actions}>
				<button
					className={styles.acceptBtn}
					onClick={handleAccept}
					disabled={isProcessing}
					title="Aceitar pedido"
				>
					<Check size={18} />
				</button>
				<button
					className={styles.rejectBtn}
					onClick={handleReject}
					disabled={isProcessing}
					title="Rejeitar pedido"
				>
					<X size={18} />
				</button>
			</div>
		</div>
	);
}