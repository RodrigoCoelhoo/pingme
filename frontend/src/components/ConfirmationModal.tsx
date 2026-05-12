import styles from '../styles/ConfirmationModal.module.css';
import type { ConfirmationConfig } from '../hooks/useConfirmation';

interface Props {
	isOpen: boolean;
	config: ConfirmationConfig | null;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ConfirmationModal({ isOpen, config, onConfirm, onCancel }: Props) {
	if (!isOpen || !config) return null;

	const variantClass = config.variant === 'danger' ? styles.danger :
		config.variant === 'warning' ? styles.warning : '';

	return (
		<div className={styles.modalOverlay} onClick={onCancel}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modalHeader}>
					<h2>{config.title}</h2>
				</div>

				<div className={styles.modalBody}>
					<p>{config.message}</p>
				</div>

				<div className={styles.modalFooter}>
					<button
						className={styles.cancelButton}
						onClick={onCancel}
					>
						{config.cancelText || 'Cancelar'}
					</button>
					<button
						className={`${styles.confirmButton} ${variantClass}`}
						onClick={onConfirm}
					>
						{config.confirmText || 'Confirmar'}
					</button>
				</div>
			</div>
		</div>
	);
}