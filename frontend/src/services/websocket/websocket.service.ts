import SockJS from 'sockjs-client';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import type {
	MessageRequest,
	MessageResponse,
} from '../message/message.types'; // Adjust path if needed
import type { PresenceEvent, TypingIndicator, WebSocketConfig } from './websocket.types';

class WebSocketService {
	private client: Client | null = null;
	private connected: boolean = false;
	private subscriptions: Map<string, StompSubscription> = new Map();
	private reconnectAttempts: number = 0;
	private maxReconnectAttempts: number = 5;

	/**
	 * Initialize and connect to WebSocket
	 */
	connect(config: WebSocketConfig): void {
		if (this.connected && this.client) {
			console.warn('⚠️  WebSocket already connected');
			return;
		}

		console.log('🔌 Connecting to WebSocket...');
		const socket = new SockJS(`${config.url}?token=${config.token}`);

		this.client = new Client({
			webSocketFactory: () => socket as any,
			reconnectDelay: 5000,
			heartbeatIncoming: 4000,
			heartbeatOutgoing: 4000,

			onConnect: () => {
				this.connected = true;
				this.reconnectAttempts = 0;
				console.log('✅ WebSocket Connected');
				config.onConnect?.();
			},

			onDisconnect: () => {
				this.connected = false;
				this.subscriptions.clear();
				console.log('❌ WebSocket Disconnected');
				config.onDisconnect?.();
			},

			onStompError: (frame) => {
				console.error('❌ STOMP error:', frame);
				config.onError?.(frame);
			},

			onWebSocketError: (error) => {
				console.error('❌ WebSocket error:', error);
				config.onError?.(error);

				if (this.reconnectAttempts < this.maxReconnectAttempts) {
					this.reconnectAttempts++;
					console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
				}
			},

			//debug: (str) => {
			// Uncomment for detailed debugging
			// console.log('🐛 STOMP Debug:', str);
			//}
		});

		this.client.activate();
	}

	/**
	 * Disconnect from WebSocket
	 */
	disconnect(): void {
		if (this.client) {
			console.log('🔌 Disconnecting WebSocket...');
			this.subscriptions.forEach(sub => sub.unsubscribe());
			this.subscriptions.clear();
			this.client.deactivate();
			this.connected = false;
			this.client = null;
		}
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.connected && this.client !== null;
	}

	/**
	 * subscreve /user/queue/messages — recebe mensagens de todos os chats do usuário
	 */
	subscribeToUserMessages(
		onMessageReceived: (message: MessageResponse) => void
	): () => void {
		if (!this.client || !this.connected) {
			console.error('❌ Cannot subscribe: WebSocket not connected');
			return () => { };
		}

		const subscriptionKey = 'user_messages';
		const existing = this.subscriptions.get(subscriptionKey);
		if (existing) {
			existing.unsubscribe();
			this.subscriptions.delete(subscriptionKey);
		}

		const subscription = this.client.subscribe(
			'/user/queue/messages',
			(message: IMessage) => {
				try {
					const payload: MessageResponse = JSON.parse(message.body);
					console.log('📨 Message received:', payload.messageId, 'chat:', payload.chatId);
					onMessageReceived(payload);
				} catch (error) {
					console.error('❌ Error parsing message:', error);
				}
			}
		);

		this.subscriptions.set(subscriptionKey, subscription);
		console.log('✅ Subscribed to user messages');

		return () => {
			const sub = this.subscriptions.get(subscriptionKey);
			if (sub) {
				sub.unsubscribe();
				this.subscriptions.delete(subscriptionKey);
			}
		};
	}

	subscribeToUserEvents(
		onEventReceived: (event: Event) => void
	): () => void {
		if (!this.client || !this.connected) return () => { };

		const subscriptionKey = 'user_events';
		const existing = this.subscriptions.get(subscriptionKey);
		if (existing) {
			existing.unsubscribe();
			this.subscriptions.delete(subscriptionKey);
		}

		const subscription = this.client.subscribe(
			'/user/queue/events',
			(message: IMessage) => {
				try {
					const payload: Event = JSON.parse(message.body);
					onEventReceived(payload);
				} catch (error) {
					console.error('❌ Error parsing event:', error);
				}
			}
		);

		this.subscriptions.set(subscriptionKey, subscription);

		return () => {
			const sub = this.subscriptions.get(subscriptionKey);
			if (sub) {
				sub.unsubscribe();
				this.subscriptions.delete(subscriptionKey);
			}
		};
	}

	/**
	 * Subscribe to typing indicators
	 */
	subscribeToTyping(
		chatId: string,
		onTypingReceived: (indicator: TypingIndicator) => void
	): () => void {
		if (!this.client || !this.connected) {
			console.error('❌ Cannot subscribe: WebSocket not connected');
			return () => { };
		}

		const destination = `/topic/chat/${chatId}/typing`;
		const subscriptionKey = `typing_${chatId}`;

		// Unsubscribe existing subscription
		const existingSub = this.subscriptions.get(subscriptionKey);
		if (existingSub) {
			existingSub.unsubscribe();
			this.subscriptions.delete(subscriptionKey);
		}

		console.log(`📡 Subscribing to typing: ${destination}`);

		const subscription = this.client.subscribe(destination, (message: IMessage) => {
			try {
				const payload: TypingIndicator = JSON.parse(message.body);
				onTypingReceived(payload);
			} catch (error) {
				console.error('❌ Error parsing typing indicator:', error);
			}
		});

		this.subscriptions.set(subscriptionKey, subscription);

		// Return unsubscribe function
		return () => {
			const sub = this.subscriptions.get(subscriptionKey);
			if (sub) {
				sub.unsubscribe();
				this.subscriptions.delete(subscriptionKey);
			}
		};
	}

	subscribeToPresence(
		callback: (event: PresenceEvent) => void
	): () => void {

		if (!this.client) {
			throw new Error('WebSocket not connected');
		}

		const subscription = this.client.subscribe(
			'/user/queue/presence',
			(message) => {
				const event: PresenceEvent =
					JSON.parse(message.body);

				callback(event);
			}
		);

		return () => subscription.unsubscribe();
	}

	/**
	 * Send a message to a chat
	 */
	sendMessage(chatId: string, payload: MessageRequest): void {
		if (!this.client || !this.connected) {
			console.error('❌ Cannot send message: WebSocket not connected');
			throw new Error('WebSocket not connected');
		}

		console.log(`📤 Publishing message to /app/chat/${chatId}/send`);

		this.client.publish({
			destination: `/app/chat/${chatId}/send`,
			body: JSON.stringify(payload)
		});
	}

	/**
	 * Send typing indicator
	 */
	sendTyping(chatId: string, isTyping: boolean): void {
		if (!this.client || !this.connected) {
			return; // Fail silently for typing indicators
		}

		this.client.publish({
			destination: `/app/chat/${chatId}/typing`,
			body: JSON.stringify({ isTyping })
		});
	}

	/**
	 * Get current subscriptions (for debugging)
	 */
	getActiveSubscriptions(): string[] {
		return Array.from(this.subscriptions.keys());
	}

	/**
	 * Unsubscribe from all subscriptions
	 */
	unsubscribeAll(): void {
		console.log('🔕 Unsubscribing from all subscriptions');
		this.subscriptions.forEach(sub => sub.unsubscribe());
		this.subscriptions.clear();
	}
}

// Export singleton instance
export default new WebSocketService();