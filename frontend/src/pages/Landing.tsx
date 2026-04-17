import styles from '../styles/Landing.module.css'
import Button from '../components/Button'
import Logo from '../assets/logo-small.png'

export default function Landing() {
	return (
		<div className={styles.landing}>
			{/* Header */}
			<header className={styles.header}>
				<div className={styles.headerContent}>
					<div className={styles.logo}>
						<img src={Logo} alt="" />
					</div>
					<div>
						<p>Theme</p>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className={styles.hero}>
				<div className={styles.heroContent}>
					<div className={styles.heroText}>
						<h1 className={styles.heroTitle}>
							Conversas que <span className={styles.highlight}>conectam</span>
						</h1>
						<p className={styles.heroSubtitle}>
							Mensagens instantâneas, simples e seguras.
							Mantém-te próximo das pessoas que importam.
						</p>
						<div className={styles.heroCta}>
							<Button variant="primary" size="large" href="/signup">
								Começar
							</Button>
							<Button variant="ghost" size="large" href="/signin">
								Entrar
							</Button>
						</div>
						<p className={styles.heroNote}>
							<p>
								<span>✓</span> Grátis para sempre
							</p>
							<p>
								<span>✓</span> Sem anúncios
							</p>
							<p>
								<span>✓</span> Encriptação end-to-end

							</p>
						</p>
					</div>
					<div className={styles.heroVisual}>
						<div className={styles.mockChat}>
							<div className={styles.mockHeader}>
								<div className={styles.mockAvatar}>R</div>
								<div className={styles.mockInfo}>
									<div className={styles.mockName}>Rodrigo Coelho</div>
									<div className={styles.mockStatus}>● online</div>
								</div>
							</div>
							<div className={styles.mockMessages}>
								<div className={styles.msgReceived}>
									<div className={styles.bubble}>Olá! Tudo bem? 👋</div>
								</div>
								<div className={styles.msgSent}>
									<div className={styles.bubble}>Tudo ótimo! E contigo? 😊</div>
								</div>
								<div className={styles.msgReceived}>
									<div className={styles.bubble}>Vamos almoçar amanhã?</div>
								</div>
								<div className={styles.msgSent}>
									<div className={styles.bubble}>Combinado! 🎉</div>
								</div>
							</div>
							<div className={styles.mockInput}>
								<div className={styles.mockEmoji}>
									🙂
								</div>
								<div className={styles.mockInputField}>Escreve uma mensagem...</div>
								<div className={styles.mockSendBtn}>
									<svg className={styles.mockSendBtnIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff">
										<path d="M2 21l21-9L2 3v7l15 2-15 2z" />
									</svg>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className={styles.footer}>
				<div className={styles.footerBottom}>
					<p>© 2026 Rodrigo Coelho</p>
				</div>
			</footer>
		</div>
	)
}