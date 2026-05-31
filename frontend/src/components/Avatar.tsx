import styles from '../styles/Avatar.module.css';
import { getColor } from '../utils/color';

type AvatarProps = {
	name: string;
	src?: string | null;
	size?: 'sm' | 'md' | 'lg' | 'xl';
};

export default function Avatar({ name, src, size = 'md' }: AvatarProps) {
	const initial = name.charAt(0).toUpperCase();
	const bgColor = getColor(name);

	return (
		<div className={`${styles.avatar} ${styles[size]}`}>
			{src ? (
				<img src={src} alt={name} />
			) : (
				<div
					className={styles.fallback}
					style={{ backgroundColor: bgColor }}
				>
					{initial}
				</div>
			)}
		</div>
	);
}