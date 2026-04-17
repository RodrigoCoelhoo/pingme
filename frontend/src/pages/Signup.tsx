import { useState, type SetStateAction } from 'react'
import styles from '../styles/Auth.module.css'
import Button from '../components/Button'
import Input from '../components/Input'

export default function SignUp() {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')

	const handleSubmit = (e: any) => {
		e.preventDefault()

		if (password !== confirmPassword) {
			alert('As passwords não coincidem!')
			return
		}

		// TODO: Add authentication logic
		console.log('Sign up:', { name, email, password })
	}

	const handleGoogleSignUp = () => {
		// TODO: Add Google OAuth logic
		console.log('Sign up with Google')
	}

	return (
		<div className={styles.authPage}>
			<div className={styles.authContainer}>
				{/* Left side - Branding */}
				<div className={styles.authBrand}>
					<div className={styles.brandContent}>
						<div className={styles.logo}>
							<div className={styles.logoIcon}>P</div>
							<span className={styles.logoText}>
								Ping<span className={styles.logoAccent}>Me</span>
							</span>
						</div>
						<h1 className={styles.brandTitle}>
							Começa a conversar hoje! 🚀
						</h1>
						<p className={styles.brandSubtitle}>
							Cria a tua conta e junta-te a milhares de utilizadores.
						</p>
						<div className={styles.brandFeatures}>
							<div className={styles.brandFeature}>
								<span className={styles.featureIcon}>✓</span>
								<span>Configuração em 30 segundos</span>
							</div>
							<div className={styles.brandFeature}>
								<span className={styles.featureIcon}>✓</span>
								<span>Sem cartão de crédito</span>
							</div>
							<div className={styles.brandFeature}>
								<span className={styles.featureIcon}>✓</span>
								<span>Grátis para sempre</span>
							</div>
						</div>
					</div>
				</div>

				{/* Right side - Form */}
				<div className={styles.authForm}>
					<div className={styles.formWrapper}>
						<div className={styles.formHeader}>
							<h2 className={styles.formTitle}>Criar conta</h2>
							<p className={styles.formSubtitle}>
								Já tens uma conta?{' '}
								<a href="/signin" className={styles.formLink}>
									Iniciar sessão
								</a>
							</p>
						</div>

						<form onSubmit={handleSubmit} className={styles.form}>
							<Input
								type="text"
								label="Nome completo"
								placeholder="João Silva"
								value={name}
								onChange={(e: { target: { value: SetStateAction<string> } }) => setName(e.target.value)}
								required
							/>

							<Input
								type="email"
								label="Email"
								placeholder="nome@exemplo.com"
								value={email}
								onChange={(e: { target: { value: SetStateAction<string> } }) => setEmail(e.target.value)}
								required
							/>

							<Input
								type="password"
								label="Password"
								placeholder="••••••••"
								value={password}
								onChange={(e: { target: { value: SetStateAction<string> } }) => setPassword(e.target.value)}
								required
								helperText="Mínimo 8 caracteres"
							/>

							<Input
								type="password"
								label="Confirmar password"
								placeholder="••••••••"
								value={confirmPassword}
								onChange={(e: { target: { value: SetStateAction<string> } }) => setConfirmPassword(e.target.value)}
								required
							/>

							<div className={styles.terms}>
								<label className={styles.checkbox}>
									<input type="checkbox" required />
									<span>
										Aceito os{' '}
										<a href="/terms" className={styles.termsLink}>
											Termos de Serviço
										</a>{' '}
										e a{' '}
										<a href="/privacy" className={styles.termsLink}>
											Política de Privacidade
										</a>
									</span>
								</label>
							</div>

							<Button type="submit" variant="primary" fullWidth>
								Criar conta
							</Button>
						</form>

						<div className={styles.divider}>
							<span>ou</span>
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
							Continuar com Google
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}