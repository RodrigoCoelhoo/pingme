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