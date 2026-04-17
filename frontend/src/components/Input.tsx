import type { InputHTMLAttributes } from 'react'
import styles from '../styles/Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string
	helperText?: string
	error?: string
}

export default function Input({
	label,
	helperText,
	error,
	className = '',
	...props
}: InputProps) {
	return (
		<div className={styles.inputGroup}>
			{label && (
				<label className={styles.label}>
					{label}
					{props.required && <span className={styles.required}>*</span>}
				</label>
			)}

			<input
				className={[
					styles.input,
					error && styles.error,
					className
				].filter(Boolean).join(' ')}
				{...props}
			/>

			{helperText && !error && (
				<p className={styles.helperText}>{helperText}</p>
			)}

			{error && (
				<p className={styles.errorText}>{error}</p>
			)}
		</div>
	)
}