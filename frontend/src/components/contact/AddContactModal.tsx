import React, { useState } from 'react';
import { X, UserPlus, Loader } from 'lucide-react';
import styles from '../../styles/contact/AddContactModal.module.css';
import Input from '../Input';
import { usernameRules } from '../../rules/rules';
import { useTranslation } from 'react-i18next';

interface AddContactModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAddContact: (username: string) => Promise<boolean>;
}

export default function AddContactModal({ isOpen, onClose, onAddContact }: AddContactModalProps) {
	const [username, setUsername] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const { t } = useTranslation("sidebar");
	const [validity, setValidity] = useState({
		username: false
	});

	const isValid = validity.username;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			setIsLoading(true);
			setSuccess(false);

			const wasSuccessful = await onAddContact(
				username.trim()
			);
			setSuccess(wasSuccessful);

			setTimeout(() => {
				if (wasSuccessful) {
					setUsername("");
				}
				setSuccess(false);
			}, 1500);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setUsername('');
		setSuccess(false);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className={styles.overlay} onClick={handleClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.header}>
					<div className={styles.titleWrapper}>
						<UserPlus size={24} className={styles.icon} />
						<h2>{t('contacts.modal.title')}</h2>
					</div>
					<button className={styles.closeBtn} onClick={handleClose}>
						<X size={24} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.body}>
					<div className={styles.inputGroup}>
						<Input
							label={t('contacts.modal.username')}
							type="text"
							placeholder="rodrigo_coelho"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							rules={usernameRules(t)}
							disabled={isLoading || success}
							required
							onValidationChange={(isValid) =>
								setValidity(v => ({ ...v, username: isValid }))
							}

						/>
					</div>

					<div className={styles.footer}>
						<button
							type="button"
							className={styles.btnSecondary}
							onClick={handleClose}
							disabled={isLoading}
						>
							{t('contacts.modal.secondaryButton')}
						</button>
						<button
							type="submit"
							className={styles.btnPrimary}
							disabled={!isValid || isLoading || success}
						>
							{isLoading ? (
								<>
									<Loader size={16} className={styles.spinner} />
									A adicionar...
								</>
							) : success ? (
								t('contacts.modal.primaryButtonSuccess')
							) : (
								t('contacts.modal.primaryButton')
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
