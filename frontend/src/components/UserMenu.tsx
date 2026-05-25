import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import UpdateProfileModal from './UpdateProfileModal';
import styles from '../styles/UserMenu.module.css';
import { EllipsisVertical, User, Languages, Palette, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/user/user.service';

export default function UserMenu() {
	const { user, signOut, updateUser } = useAuth();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const { theme, setTheme } = useTheme()
	const { i18n, t } = useTranslation("common")

	const toggleTheme = () => {
		setTheme(theme === 'dark' ? 'light' : 'dark')
	}

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};

		if (isDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isDropdownOpen]);

	const handleUpdateProfile = async (
		displayName: string,
		avatarFile?: File
	) => {

		try {

			const updatedUser = await userService.updateUser(
				{
					displayName
				},
				avatarFile
			);

			updateUser(updatedUser);

		} catch (error) {
			console.error("Failed to update profile", error);
		}
	};

	const handleChangeLanguage = () => {
		// Implementar lógica de mudança de idioma
		console.log('Change language');
		i18n.changeLanguage(i18n.language === 'en' ? 'pt' : 'en');
		setIsDropdownOpen(false);
	};

	const handleChangeTheme = () => {
		toggleTheme();
		setIsDropdownOpen(false);
	};

	const handleLogout = () => {
		setIsDropdownOpen(false);
		signOut();
	};

	return (
		<>
			<div className={styles.userProfile}>
				<div className={styles.userInfoContainer}>
					<Avatar
						name={user?.displayName || 'User'}
						src={user?.avatarUrl || null}
						size="md"
					/>

					<div className={styles.userInfo}>
						<p className={styles.displayName}>
							{user?.displayName || 'User'}
						</p>
						<p className={styles.username}>
							@{user?.username || 'username'}
						</p>
					</div>
				</div>

				<div className={styles.menuContainer} ref={dropdownRef}>
					<button
						className={styles.menuBtn}
						onClick={() => setIsDropdownOpen(!isDropdownOpen)}
						aria-label="Menu de opções"
					>
						<EllipsisVertical size={20} />
					</button>

					{isDropdownOpen && (
						<div className={styles.dropdown}>
							<button
								className={styles.dropdownItem}
								onClick={() => {
									setIsProfileModalOpen(true);
									setIsDropdownOpen(false);
								}}
							>
								<User size={18} />
								<span>{t('editProfile')}</span>
							</button>

							<button
								className={styles.dropdownItem}
								onClick={handleChangeLanguage}
							>
								<Languages size={18} />
								<span>{t('language')}</span>
							</button>

							<button
								className={styles.dropdownItem}
								onClick={handleChangeTheme}
							>
								<Palette size={18} />
								<span>{t('theme')}</span>
							</button>

							<div className={styles.dropdownDivider} />

							<button
								className={`${styles.dropdownItem} ${styles.danger}`}
								onClick={handleLogout}
							>
								<LogOut size={18} />
								<span>{t('logout')}</span>
							</button>
						</div>
					)}
				</div>
			</div>

			<UpdateProfileModal
				isOpen={isProfileModalOpen}
				onClose={() => setIsProfileModalOpen(false)}
				user={user}
				onUpdate={handleUpdateProfile}
			/>
		</>
	);
}