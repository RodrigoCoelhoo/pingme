import { useEffect, useRef, useCallback } from 'react';
import webSocketService from '../services/websocket/websocket.service';
import type { MessageResponse } from '../services/message/message.types';
import type { TypingIndicator } from '../services/websocket/websocket.types';

interface UseWebSocketProps {
	chatId: string | null;
	token: string | null;
	onMessageReceived?: (message: MessageResponse) => void;
	onTypingReceived?: (indicator: TypingIndicator) => void;
	enabled?: boolean;
}

export function useWebSocket({
	chatId,
	token,
	onMessageReceived,
	onTypingReceived,
	enabled = true
}: UseWebSocketProps) {
	const isInitializedRef = useRef(false);
	const currentChatIdRef = useRef<string | null>(null);
	const unsubscribeFnsRef = useRef<(() => void)[]>([]);

	// Use refs for callbacks to avoid stale closures
	const onMessageReceivedRef = useRef(onMessageReceived);
	const onTypingReceivedRef = useRef(onTypingReceived);

	// Update refs when callbacks change
	useEffect(() => {
		onMessageReceivedRef.current = onMessageReceived;
		onTypingReceivedRef.current = onTypingReceived;
	}, [onMessageReceived, onTypingReceived]);

	// Initialize WebSocket connection (once per session)
	useEffect(() => {
		if (!enabled || !token || isInitializedRef.current) return;

		console.log('🔌 Initializing WebSocket connection...');

		webSocketService.connect({
			url: import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws',
			token,
			onConnect: () => {
				console.log('✅ WebSocket connected');
				isInitializedRef.current = true;
			},
			onDisconnect: () => {
				console.log('❌ WebSocket disconnected');
				isInitializedRef.current = false;
			},
			onError: (error) => {
				console.error('❌ WebSocket error:', error);
			}
		});

		// Cleanup on unmount
		return () => {
			console.log('🧹 Cleaning up WebSocket connection');
			unsubscribeFnsRef.current.forEach(unsub => unsub());
			unsubscribeFnsRef.current = [];
			webSocketService.disconnect();
			isInitializedRef.current = false;
		};
	}, [token, enabled]);

	// Subscribe to chat when chatId changes
	useEffect(() => {
		if (!chatId || !enabled) {
			// Unsubscribe from previous chat
			unsubscribeFnsRef.current.forEach(unsub => unsub());
			unsubscribeFnsRef.current = [];
			currentChatIdRef.current = null;
			return;
		}

		// Don't resubscribe if it's the same chat
		if (currentChatIdRef.current === chatId) {
			console.log('⏭️  Same chat, skipping resubscription');
			return;
		}

		console.log(`📡 Subscribing to chat: ${chatId}`);
		currentChatIdRef.current = chatId;

		// Unsubscribe from previous chat first
		unsubscribeFnsRef.current.forEach(unsub => unsub());
		unsubscribeFnsRef.current = [];

		// Wait for connection to be ready
		const subscribeInterval = setInterval(() => {
			if (!webSocketService.isConnected()) {
				console.log('⏳ Waiting for WebSocket connection...');
				return;
			}

			clearInterval(subscribeInterval);

			// Subscribe to messages
			const unsubMessage = webSocketService.subscribeToChat(chatId, (message) => {
				console.log('📨 Received message via WebSocket:', message.messageId);
				onMessageReceivedRef.current?.(message);
			});

			// Subscribe to typing
			const unsubTyping = webSocketService.subscribeToTyping(chatId, (indicator) => {
				console.log('⌨️  Typing indicator:', indicator);
				onTypingReceivedRef.current?.(indicator);
			});

			unsubscribeFnsRef.current = [unsubMessage, unsubTyping];
			console.log('✅ Subscribed to chat:', chatId);
		}, 100);

		// Cleanup timeout after 5 seconds if connection never established
		const timeoutId = setTimeout(() => {
			clearInterval(subscribeInterval);
			if (!webSocketService.isConnected()) {
				console.error('❌ Failed to establish WebSocket connection');
			}
		}, 5000);

		return () => {
			clearInterval(subscribeInterval);
			clearTimeout(timeoutId);
			unsubscribeFnsRef.current.forEach(unsub => unsub());
			unsubscribeFnsRef.current = [];
		};
	}, [chatId, enabled]);

	// Send message function
	const sendMessage = useCallback((content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') => {
		if (!chatId) {
			console.error('❌ No chat selected');
			return;
		}

		if (!webSocketService.isConnected()) {
			console.error('❌ WebSocket not connected');
			throw new Error('WebSocket not connected');
		}

		console.log('📤 Sending message via WebSocket...');
		webSocketService.sendMessage(chatId, { content, type });
	}, [chatId]);

	// Send typing indicator function
	const sendTyping = useCallback((isTyping: boolean) => {
		if (!chatId || !webSocketService.isConnected()) return;
		webSocketService.sendTyping(chatId, isTyping);
	}, [chatId]);

	return {
		sendMessage,
		sendTyping,
		isConnected: isInitializedRef.current
	};
}