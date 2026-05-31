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

export function getColor(key: string) {
	const hash = hashString(key);
	return colors[Math.abs(hash) % colors.length];
}