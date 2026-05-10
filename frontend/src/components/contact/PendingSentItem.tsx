import { X, Clock } from 'lucide-react';
import styles from '../../styles/contact/PendingSentItem.module.css';
import type { ContactResponse } from '../../services/contact/contact.types';
import { useEffect, useState } from 'react';
import Avatar from '../Avatar';

interface PendingSentItemProps {
	contact: ContactResponse;
	onCancel: (contactId: string) => void;
}

export default function PendingSentItem({ contact, onCancel }: PendingSentItemProps) {
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleCancel = async () => {
		setIsProcessing(true);
		try {
			await onCancel(contact.contactId);
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
				<span className={styles.status}>
					<Clock size={14} />
					Pendente
				</span>
			</div>

			<button
				className={styles.cancelBtn}
				onClick={handleCancel}
				disabled={isProcessing}
				title="Cancelar pedido"
			>
				<X size={18} />
			</button>
		</div>
	);
}