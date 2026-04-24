import styles from '../styles/Landing.module.css'
import Button from '../components/Button'
import { Trans, useTranslation } from 'react-i18next'

export default function Landing() {
	const { t } = useTranslation("landing")
	const { t: common } = useTranslation('common')

	return (
		<div className={styles.landing}>
			{/* Hero Section */}
			<section className={styles.hero}>
				<div className={styles.heroContent}>
					<div className={styles.heroText}>
						<h1 className={styles.heroTitle}>
							<Trans ns={"landing"} i18nKey="header" components={{ strong: <strong /> }} />
						</h1>
						<p className={styles.heroSubtitle}>
							{t('p.0')}
							{t('p.1')}
						</p>
						<div className={styles.heroCta}>
							<Button variant="primary" size="large" to="/signup">
								{common('start')}
							</Button>

							<Button variant="ghost" size="large" to="/signin">
								{common('login')}
							</Button>
						</div>
						<p className={styles.heroNote}>
							<p>
								<span>✓ </span> {t('checks.0')}
							</p>
							<p>
								<span>✓ </span> {t('checks.1')}
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
									<div className={styles.bubble}>{t('messages.0')}</div>
								</div>
								<div className={styles.msgSent}>
									<div className={styles.bubble}>{t('messages.1')}</div>
								</div>
								<div className={styles.msgReceived}>
									<div className={styles.bubble}>{t('messages.2')}</div>
								</div>
								<div className={styles.msgSent}>
									<div className={styles.bubble}>{t('messages.3')}</div>
								</div>
							</div>
							<div className={styles.mockInput}>
								<div className={styles.mockEmoji}>
									🙂
								</div>
								<div className={styles.mockInputField}>{t('messages.4')}</div>
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
		</div>
	)
}