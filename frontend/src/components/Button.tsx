import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from '../styles/Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
	size?: 'small' | 'medium' | 'large'
	fullWidth?: boolean
	href?: string
	icon?: ReactNode
	children: ReactNode
}

export default function Button({
	variant = 'primary',
	size = 'medium',
	fullWidth = false,
	href,
	icon,
	children,
	className = '',
	...props
}: ButtonProps) {
	const classes = [
		styles.btn,
		styles[variant],
		styles[size],
		fullWidth && styles.fullWidth,
		className
	].filter(Boolean).join(' ')

	if (href) {
		return (
			<a href={href} className={classes}>
				{icon && <span className={styles.icon}>{icon}</span>}
				{children}
			</a>
		)
	}

	return (
		<button className={classes} {...props}>
			{icon && <span className={styles.icon}>{icon}</span>}
			{children}
		</button>
	)
}