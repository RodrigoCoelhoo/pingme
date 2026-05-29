import { type FormEvent, useState } from 'react'
import styles from '../styles/Auth.module.css'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuth } from '../contexts/AuthContext'
import { displayNameRules, emailRules, passwordRules, usernameRules } from '../rules/rules'
import Logo from '../assets/favicon-192.png'
import { Trans, useTranslation } from 'react-i18next'

export default function SignUp() {
	const [displayName, setDisplayName] = useState('')
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [acceptedTerms, setAcceptedTerms] = useState(false)

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [validity, setValidity] = useState({
		displayName: false,
		username: false,
		email: false,
		password: false,
		confirmPassword: false
	})

	const { t } = useTranslation("auth");

	const isFormValid = Object.values(validity).every(Boolean) && acceptedTerms

	const { signUp } = useAuth();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()

		if (!isFormValid) {
			setError(t('signup.errorDefault'))
			return
		}

		setLoading(true);
		setError(null);

		try {
			await signUp(email, username, password, displayName);
		} catch (err: any) {
			const message =
				err?.response?.data?.message ||
				err?.message ||
				'Erro ao criar conta'

			setError(message)
		} finally {
			setLoading(false);
		}
	}

	const handleGoogleSignUp = () => {
		window.location.href = `${import.meta.env.VITE_BACKEND_URL}/oauth2/authorization/google`
	}

	return (
		<div className={styles.authPage}>
			<div className={styles.authContainer}>
				{/* Left side - Branding */}
				<div className={styles.authBrand}>
					<div className={styles.brandContent}>
						<div className={styles.logo}>
							<img src={Logo} alt="PingMe Logo" className={styles.logoIcon} />
							<span className={styles.logoText}>
								Ping<span className={styles.logoAccent}>Me</span>
							</span>
						</div>
						<div className={styles.brand}>
							<div className={styles.brandDescription}>
								<h1 className={styles.brandTitle}>
									{t('signup.brand.title')}
								</h1>
								<p className={styles.brandSubtitle}>
									{t('signup.brand.subtitle')}
								</p>
							</div>
							<div className={styles.brandFeatures}>
								<div className={styles.brandFeature}>
									<span className={styles.featureIcon}>✓</span>
									<span>{t('signup.brand.features.0')}</span>
								</div>
								<div className={styles.brandFeature}>
									<span className={styles.featureIcon}>✓</span>
									<span>{t('signup.brand.features.1')}</span>
								</div>
								<div className={styles.brandFeature}>
									<span className={styles.featureIcon}>✓</span>
									<span>{t('signup.brand.features.2')}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Right side - Form */}
				<div className={styles.authForm}>
					<div className={styles.formWrapper}>
						<div className={styles.formHeader}>
							<h2 className={styles.formTitle}>{t('signup.title')}</h2>
							<p className={styles.formSubtitle}>
								{t('signup.subtitle')}{' '}
								<a href="/signin" className={styles.formLink}>
									{t('signup.signin')}
								</a>
							</p>
						</div>

						{error && (
							<div style={{ color: 'red', marginBottom: '10px' }}>
								{error}
							</div>
						)}

						<form onSubmit={handleSubmit} className={styles.form}>
							<Input
								type="text"
								label={t('signup.displayName')}
								placeholder={t('signup.displayNamePlaceholder')}
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								rules={displayNameRules(t)}
								required
								onValidationChange={(isValid) =>
									setValidity(v => ({ ...v, displayName: isValid }))
								}
							/>

							<Input
								label={t('signup.username')}
								type="text"
								placeholder={t('signup.usernamePlaceholder')}
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								rules={usernameRules(t)}
								required
								onValidationChange={(isValid) =>
									setValidity(v => ({ ...v, username: isValid }))
								}
							/>

							<Input
								label={t('signup.email')}
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								rules={emailRules(t)}
								required
								placeholder={t('signup.emailPlaceholder')}
								onValidationChange={(isValid) =>
									setValidity(v => ({ ...v, email: isValid }))
								}
							/>

							<Input
								label={t('signup.password')}
								type="password"
								placeholder={t('signup.passwordPlaceholder')}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								rules={passwordRules(t)}
								required
								onValidationChange={(isValid) =>
									setValidity(v => ({ ...v, password: isValid }))
								}
							/>

							<Input
								label={t('signup.confirmPassword')}
								type="password"
								placeholder={t('signup.confirmPasswordPlaceholder')}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								matchValue={password}
								required
								onValidationChange={(isValid) =>
									setValidity(v => ({ ...v, confirmPassword: isValid }))
								}
							/>

							<div className={styles.terms}>
								<label className={styles.checkbox}>
									<input
										type="checkbox"
										checked={acceptedTerms}
										onChange={(e) => setAcceptedTerms(e.target.checked)}
										required
									/>
									<span>
										<Trans ns={"auth"} i18nKey="signup.terms" components={{ a: <a /> }} />
									</span>
								</label>
							</div>

							<Button
								type="submit"
								variant="primary"
								fullWidth
								disabled={loading || !isFormValid}
							>
								{loading ? t('signup.submitting') : t('signup.submit')}
							</Button>
						</form>

						<div className={styles.divider}>
							<span>{t('signin.divider')}</span>
						</div>

						<Button
							type="button"
							variant="outline"
							fullWidth
							onClick={handleGoogleSignUp}
							icon={
								<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
									<path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
									<path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853" />
									<path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
									<path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335" />
								</svg>
							}
						>
							{t('signin.google')}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}