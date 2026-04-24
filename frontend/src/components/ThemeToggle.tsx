import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import styles from '../styles/ThemeToggle.module.css';
import { useTheme } from 'next-themes';

const ThemeToggle = () => {
	const { theme, setTheme } = useTheme()

	const toggleTheme = () => {
		setTheme(theme === 'dark' ? 'light' : 'dark')
	}

	return (
		<button
			onClick={toggleTheme}
			className={styles.toggleContainer}
		>
			<div className={styles.iconWrapper}>
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={theme}
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: -10, opacity: 0 }}
						transition={{ duration: 0.2 }}
						style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
					>
						{theme === 'dark' ? (
							<Moon size={20} className={styles.moonIcon} />
						) : (
							<Sun size={20} className={styles.sunIcon} />
						)}
					</motion.div>
				</AnimatePresence>
			</div>
		</button>
	);
};

export default ThemeToggle;