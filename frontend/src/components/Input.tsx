import { useCallback, useEffect, useState, type InputHTMLAttributes } from 'react'
import styles from '../styles/Input.module.css'
import { useTranslation } from 'react-i18next';

export type Rule = (value: string) => true | string;

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string
	helperText?: string
	error?: string
	type?: 'text' | 'password' | 'email' | 'url'
	rules?: Rule[]
	value?: string
	matchValue?: string
	onValidationChange?: (isValid: boolean) => void
}

export default function Input({
	label,
	helperText,
	error: externalError,
	type = 'text',
	rules = [],
	value = '',
	matchValue,
	className = '',
	onChange,
	onBlur,
	onValidationChange,
	...props
}: InputProps) {
	const [showPassword, setShowPassword] = useState(false)
	const [internalError, setInternalError] = useState<string>('')
	const [touched, setTouched] = useState(false)

	const { t } = useTranslation("auth");

	const error = externalError || (touched ? internalError : '')

	const validateValue = useCallback((val: string) => {
		
		if (props.required && !val.trim()) {
			setInternalError(t('input.required'))
			onValidationChange?.(false)
			return
		}

		if (matchValue !== undefined && val !== matchValue) {
			setInternalError(t('input.passwordsDontMatch'))
			onValidationChange?.(false)
			return
		}

		if (rules.length === 0) {
			setInternalError('')
			onValidationChange?.(true)
			return
		}

		for (const rule of rules) {
			const result = rule(val)
			if (result !== true) {
				setInternalError(t(result))
				onValidationChange?.(false)
				return
			}
		}

		setInternalError('')
		onValidationChange?.(true)
	}, [matchValue, rules, onValidationChange])

	useEffect(() => {
		validateValue(value)
	}, [value, matchValue, validateValue])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
		if (touched) {
			validateValue(newValue)
		}
		onChange?.(e)
	}

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		setTouched(true)
		validateValue(e.target.value)
		onBlur?.(e)
	}

	const inputType = type === 'password' && showPassword ? 'text' : type

	return (
		<div className={styles.inputGroup}>
			{label && (
				<label className={styles.label}>
					{label}
					{props.required && <span className={styles.required}>*</span>}
				</label>
			)}

			<div className={styles.inputWrapper}>
				<input
					type={inputType}
					className={[
						styles.input,
						error && styles.error,
						type === 'password' && styles.passwordInput,
						className
					].filter(Boolean).join(' ')}
					value={value}
					onChange={handleChange}
					onBlur={handleBlur}
					{...props}
				/>

				{type === 'password' && (
					<button
						type="button"
						className={styles.togglePassword}
						onClick={() => setShowPassword(!showPassword)}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						tabIndex={-1}
					>
						{showPassword ? (
							<EyeOffIcon />
						) : (
							<EyeIcon />
						)}
					</button>
				)}
			</div>

			{helperText && !error && (
				<p className={styles.helperText}>{helperText}</p>
			)}

			{error && (
				<p className={styles.errorText}>{error}</p>
			)}
		</div>
	)
}

// Simple SVG icons
function EyeIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	)
}

function EyeOffIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
			<line x1="1" y1="1" x2="23" y2="23" />
		</svg>
	)
}