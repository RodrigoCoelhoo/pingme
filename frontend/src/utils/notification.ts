export function playNotificationSound() {
	const notificationSound = new Audio('/sounds/notification.mp3');
	notificationSound.currentTime = 0;
	notificationSound.volume = 0.2;
	return notificationSound.play().catch(() => { });
}