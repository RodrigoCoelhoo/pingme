import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from '../styles/Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
	size?: 'small' | 'medium' | 'large'
	fullWidth?: boolean
	to?: string // 👈 use this instead of href
	icon?: ReactNode
	children: ReactNode
}

export default function Button({
	variant = 'primary',
	size = 'medium',
	fullWidth = false,
	to,
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

	if (to) {
		return (
			<Link to={to} className={classes}>
				{icon && <span className={styles.icon}>{icon}</span>}
				{children}
			</Link>
		)
	}

	return (
		<button className={classes} {...props}>
			{icon && <span className={styles.icon}>{icon}</span>}
			{children}
		</button>
	)
}