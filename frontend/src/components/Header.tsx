import styles from '../styles/Header.module.css'
import Logo from '../assets/logo-small.png'
import ThemeToggle from './ThemeToggle'
import LangSwitch from './LangSwitch'
import { Link } from 'react-router-dom'

type Language = 'en' | 'pt'

type HeaderProps = {
	lang: Language
	toggleLang: () => void
}

const Header = ({ lang, toggleLang }: HeaderProps) => {
	return (
		<header className={styles.header}>
			<div className={styles.headerContent}>
				<Link to="/">
					<div className={styles.logo}>
						<img src={Logo} alt="" />
					</div>
				</Link>
				<div className={styles.controls}>
					<ThemeToggle />
					<LangSwitch lang={lang} onToggle={toggleLang} />
				</div>
			</div>
		</header>
	)
}

export default Header