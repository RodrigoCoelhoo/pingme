export function formatTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();

	const time = date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});

	const isSameDay =
		date.getDate() === now.getDate() &&
		date.getMonth() === now.getMonth() &&
		date.getFullYear() === now.getFullYear();

	if (isSameDay) {
		return time;
	}

	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);

	const isYesterday =
		date.getDate() === yesterday.getDate() &&
		date.getMonth() === yesterday.getMonth() &&
		date.getFullYear() === yesterday.getFullYear();

	if (isYesterday) {
		return `Yesterday ${time}`;
	}

	const formattedDate = date.toLocaleDateString([], {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

	return `${formattedDate} ${time}`;
}