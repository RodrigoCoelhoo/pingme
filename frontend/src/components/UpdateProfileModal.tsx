// components/UpdateProfileModal.tsx
import { useState } from 'react';
import { X, Camera } from 'lucide-react';
import Input from './Input';
import Avatar from './Avatar';
import styles from '../styles/UpdateProfileModal.module.css';

interface UpdateProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentDisplayName: string;
	currentAvatarUrl: string | null;
	onUpdate: (displayName: string, avatarFile?: File) => void;
}

export default function UpdateProfileModal({
	isOpen,
	onClose,
	currentDisplayName,
	currentAvatarUrl,
	onUpdate
}: UpdateProfileModalProps) {
	const [displayName, setDisplayName] = useState(currentDisplayName);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
	const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
	const [isValid, setIsValid] = useState(true);

	if (!isOpen) return null;

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setAvatarFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setAvatarPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (isValid && displayName.trim()) {
			onUpdate(displayName, avatarFile);
			onClose();
		}
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modalHeader}>
					<h2>Atualizar Perfil</h2>
					<button className={styles.closeBtn} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className={styles.modalBody}>
						<div className={styles.avatarSection}>
							<div className={styles.avatarWrapper}>
								<Avatar
									name={displayName || 'User'}
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
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							onValidationChange={setIsValid}
							disabled
							placeholder="Digite seu nome de exibição"
						/>

						<Input
							label="Email"
							type="email"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							onValidationChange={setIsValid}
							disabled
							placeholder="Digite seu nome de exibição"
						/>
					</div>

					<div className={styles.modalFooter}>
						<button
							type="button"
							className={styles.cancelBtn}
							onClick={onClose}
						>
							Cancelar
						</button>
						<button
							type="submit"
							className={styles.submitBtn}
							disabled={!isValid || !displayName.trim()}
						>
							Guardar Alterações
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}