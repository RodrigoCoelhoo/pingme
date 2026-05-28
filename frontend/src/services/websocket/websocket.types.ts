export interface TypingIndicator {
  chatId: string;
  userId: string;
  displayName: string;
  isTyping: boolean;
}

export interface WebSocketConfig {
  url: string;
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export enum PresenceStatus {
	ONLINE = 'ONLINE',
	OFFLINE = 'OFFLINE'
}

export interface PresenceEvent {
	userId: string;
	status: PresenceStatus;
	lastSeenAt: string | null;
}