import type { TFunction } from "i18next";

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

export function formatLastSeen(
	dateString: string | null | undefined,
	t: TFunction
): string {
	if (!dateString) {
		return 'Offline';
	}

	const date = new Date(dateString);
	const now = new Date();

	const diffMs = now.getTime() - date.getTime();

	const minutes = Math.floor(diffMs / (1000 * 60));
	const hours = Math.floor(diffMs / (1000 * 60 * 60));
	const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const weeks = Math.floor(days / 7);

	if (minutes < 1) {
		return `${t("time.lastSeenJustNow")}`;
	}

	if (minutes < 60) {
		return `${t("time.seenLastTime", { time: minutes, units: (minutes === 1 ? t("time.minute") : t("time.minutes")) })}`;
	}

	if (hours < 24) {
		return `${t("time.seenLastTime", { time: hours, units: (hours === 1 ? t("time.hour") : t("time.hours")) })}`;
	}

	if (days === 1) {
		return `${t("time.seenLastTime", { time: days, units: t("time.day") })}`;
	}

	if (days < 7) {
		return `${t("time.seenLastTime", { time: days, units: t("time.days") })}`;
	}

	if (weeks < 5) {
		return `${t("time.seenLastTime", { time: weeks, units: (weeks === 1 ? t("time.week") : t("time.weeks")) })}`;
	}

	return t("time.lastSeenDate", { date: date.toLocaleDateString('pt-PT') });
}