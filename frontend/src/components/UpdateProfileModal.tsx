import { useEffect, useState } from 'react';
import { X, Camera } from 'lucide-react';

import Input from './Input';
import Avatar from './Avatar';

import styles from '../styles/UpdateProfileModal.module.css';

import type { UserProfile } from '../services/user/user.types';
import { showError } from '../utils/toast';

interface UpdateProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
	user: UserProfile | null;

	onUpdate: (
		displayName: string,
		avatarFile?: File
	) => Promise<void>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function UpdateProfileModal({
	isOpen,
	onClose,
	user,
	onUpdate
}: UpdateProfileModalProps) {

	const [displayName, setDisplayName] = useState('');
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);

	const [isValid, setIsValid] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {

		if (isOpen && user) {
			setDisplayName(user.displayName || '');
			setAvatarPreview(user.avatarUrl || null);
			setAvatarFile(undefined);
		}

	}, [isOpen, user]);

	if (!isOpen) return null;

	const trimmedDisplayName = displayName.trim();

	const hasChanges =
		trimmedDisplayName !== (user?.displayName || '').trim()
		|| !!avatarFile;

	const handleAvatarChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {

		const file = e.target.files?.[0];

		if (!file) return;

		if (!file.type.startsWith('image/')) {
			showError('Please select a valid image.');
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			showError('Image must be smaller than 5MB.');
			return;
		}

		setAvatarFile(file);

		const reader = new FileReader();

		reader.onloadend = () => {
			setAvatarPreview(reader.result as string);
		};

		reader.readAsDataURL(file);
	};

	const handleSubmit = async (
		e: React.FormEvent
	) => {

		e.preventDefault();

		if (!isValid || !hasChanges) {
			return;
		}

		try {

			setIsLoading(true);

			await onUpdate(
				trimmedDisplayName,
				avatarFile
			);

			onClose();

		} catch (error) {

			console.error(
				'Failed to update profile',
				error
			);

		} finally {

			setIsLoading(false);
		}
	};

	return (
		<div
			className={styles.modalOverlay}
			onClick={onClose}
		>

			<div
				className={styles.modalContent}
				onClick={(e) => e.stopPropagation()}
			>

				<div className={styles.modalHeader}>

					<h2>
						Atualizar Perfil
					</h2>

					<button
						className={styles.closeBtn}
						onClick={onClose}
						disabled={isLoading}
					>
						<X size={20} />
					</button>

				</div>

				<form onSubmit={handleSubmit}>

					<div className={styles.modalBody}>

						<div className={styles.avatarSection}>

							<div className={styles.avatarWrapper}>

								<Avatar
									name={trimmedDisplayName || 'User'}
									src={avatarPreview}
									size="xl"
								/>

								<label className={styles.avatarUpload}>

									<Camera size={20} />

									<input
										type="file"
										accept="image/*"
										onChange={handleAvatarChange}
										style={{ display: 'none' }}
										disabled={isLoading}
									/>

								</label>

							</div>

							<p className={styles.avatarHint}>
								Clique no ícone para alterar a foto de perfil
							</p>

						</div>

						<Input
							label="Nome de Exibição"
							type="text"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							onValidationChange={setIsValid}
							required
							placeholder="Digite seu nome de exibição"
						/>

						<Input
							label="Username"
							type="text"
							value={user?.username || ''}
							onChange={() => { }}
							disabled
							placeholder="Username"
						/>

						<Input
							label="Email"
							type="email"
							value={user?.email || ''}
							onChange={() => { }}
							disabled
							placeholder="Email"
						/>

					</div>

					<div className={styles.modalFooter}>

						<button
							type="button"
							className={styles.cancelBtn}
							onClick={onClose}
							disabled={isLoading}
						>
							Cancelar
						</button>

						<button
							type="submit"
							className={styles.submitBtn}
							disabled={
								!isValid
								|| !hasChanges
								|| isLoading
							}
						>
							{
								isLoading
									? 'Guardando...'
									: 'Guardar Alterações'
							}
						</button>

					</div>

				</form>

			</div>

		</div>
	);
}