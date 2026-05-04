import React, { useState } from 'react';
import { X, UserPlus, Loader } from 'lucide-react';
import styles from '../../styles/contact/AddContactModal.module.css';

interface AddContactModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAddContact: (username: string) => Promise<void>;
}

export default function AddContactModal({ isOpen, onClose, onAddContact }: AddContactModalProps) {
	const [username, setUsername] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!username.trim()) {
			setError('Por favor introduz um username');
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccess(false);

		try {
			await onAddContact(username.trim());
			setSuccess(true);
			setTimeout(() => {
				handleClose();
			}, 1500);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Erro ao adicionar contacto');
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setUsername('');
		setError(null);
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
						<h2>Adicionar Contacto</h2>
					</div>
					<button className={styles.closeBtn} onClick={handleClose}>
						<X size={24} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.body}>
					<div className={styles.inputGroup}>
						<label htmlFor="username">Username</label>
						<input
							id="username"
							type="text"
							placeholder="Digite o username..."
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={isLoading || success}
							autoFocus
						/>
					</div>

					{error && (
						<div className={styles.errorMessage}>
							{error}
						</div>
					)}

					{success && (
						<div className={styles.successMessage}>
							Pedido de contacto enviado com sucesso!
						</div>
					)}

					<div className={styles.footer}>
						<button
							type="button"
							className={styles.btnSecondary}
							onClick={handleClose}
							disabled={isLoading}
						>
							Cancelar
						</button>
						<button
							type="submit"
							className={styles.btnPrimary}
							disabled={isLoading || success}
						>
							{isLoading ? (
								<>
									<Loader size={16} className={styles.spinner} />
									A adicionar...
								</>
							) : success ? (
								'Adicionado!'
							) : (
								'Adicionar'
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
