import { PT, US } from 'country-flag-icons/react/3x2'
import styles from '../styles/LangSwitch.module.css'

type Language = 'en' | 'pt'

interface LangSwitchProps {
	lang: Language
	onToggle: () => void
}

export default function LangSwitch({ lang, onToggle }: LangSwitchProps) {
	return (
		<button
			className={styles.switch}
			onClick={onToggle}
			aria-label={`Switch to ${lang === 'en' ? 'Portuguese' : 'English'}`}
		>
			{/* Sliding highlight — moves left for EN, right for PT */}
			<span
				className={styles.pill}
				data-pos={lang === 'en' ? 'left' : 'right'}
			/>

			{/* EN option */}
			<span className={`${styles.option} ${lang === 'en' ? styles.active : ''}`}>
				<US className={styles.flag} title="English" />
				<span className={styles.label}>EN</span>
			</span>

			{/* PT option */}
			<span className={`${styles.option} ${lang === 'pt' ? styles.active : ''}`}>
				<PT className={styles.flag} title="Português" />
				<span className={styles.label}>PT</span>
			</span>
		</button>
	)
}