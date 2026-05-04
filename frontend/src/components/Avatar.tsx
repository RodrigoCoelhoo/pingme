import styles from '../styles/Avatar.module.css';

const colors = [
	'#F87171',
	'#FB923C',
	'#FACC15',
	'#4ADE80',
	'#34D399',
	'#22D3EE',
	'#60A5FA',
	'#A78BFA',
	'#F472B6',
];

function hashString(str: string) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	return hash;
}

function getColor(key: string) {
	const hash = hashString(key);
	return colors[Math.abs(hash) % colors.length];
}

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