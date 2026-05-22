import { useEffect, useRef, useCallback } from 'react';
import webSocketService from '../services/websocket/websocket.service';
import type { MessageResponse } from '../services/message/message.types';
import type { TypingIndicator } from '../services/websocket/websocket.types';
import type { ChatEvent } from '../services/chat/chat.types';

interface UseWebSocketProps {
	chatId: string | null;
	token: string | null;
	onMessageReceived?: (message: MessageResponse) => void;
	onTypingReceived?: (indicator: TypingIndicator) => void;
	onEventReceived?: (event: ChatEvent) => void; 
	enabled?: boolean;
}

export function useWebSocket({
	chatId,
	token,
	onMessageReceived,
	onTypingReceived,
	onEventReceived,
	enabled = true
}: UseWebSocketProps) {
	const isInitializedRef = useRef(false);
	const currentTypingChatIdRef = useRef<string | null>(null);
	const unsubscribeTypingRef = useRef<(() => void) | null>(null);
	const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
	const unsubscribeEventsRef = useRef<(() => void) | null>(null);

	const onEventReceivedRef = useRef(onEventReceived);
	const onMessageReceivedRef = useRef(onMessageReceived);
	const onTypingReceivedRef = useRef(onTypingReceived);

	useEffect(() => {
		onMessageReceivedRef.current = onMessageReceived;
		onTypingReceivedRef.current = onTypingReceived;
		onEventReceivedRef.current = onEventReceived;
	}, [onMessageReceived, onTypingReceived, onEventReceived]);

	// Conexão + subscrição global de mensagens (uma vez por sessão)
	useEffect(() => {
		if (!enabled || !token || isInitializedRef.current) return;

		webSocketService.connect({
			url: import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws',
			token,
			onConnect: () => {
				console.log('✅ WebSocket connected');
				isInitializedRef.current = true;

				unsubscribeMessagesRef.current = webSocketService.subscribeToUserMessages(
					(message) => {
						onMessageReceivedRef.current?.(message);
					}
				);

				unsubscribeEventsRef.current = webSocketService.subscribeToUserEvents(
					(event) => onEventReceivedRef.current?.(event)
				);
			},
			onDisconnect: () => {
				console.log('❌ WebSocket disconnected');
				isInitializedRef.current = false;
			},
			onError: (error) => console.error('❌ WebSocket error:', error)
		});

		return () => {
			unsubscribeMessagesRef.current?.();
			unsubscribeTypingRef.current?.();
			unsubscribeEventsRef.current?.();
			webSocketService.disconnect();
			isInitializedRef.current = false;
		};
	}, [token, enabled]);

	// Typing — subscreve/resubscreve quando muda o chat ativo
	useEffect(() => {
		if (!chatId || !enabled) {
			unsubscribeTypingRef.current?.();
			unsubscribeTypingRef.current = null;
			currentTypingChatIdRef.current = null;
			return;
		}

		if (currentTypingChatIdRef.current === chatId) return;

		unsubscribeTypingRef.current?.();
		unsubscribeTypingRef.current = null;
		currentTypingChatIdRef.current = chatId;

		const interval = setInterval(() => {
			if (!webSocketService.isConnected()) return;
			clearInterval(interval);

			unsubscribeTypingRef.current = webSocketService.subscribeToTyping(
				chatId,
				(indicator) => {
					onTypingReceivedRef.current?.(indicator);
				}
			);

			console.log('✅ Subscribed to typing:', chatId);
		}, 100);

		const timeout = setTimeout(() => clearInterval(interval), 5000);

		return () => {
			clearInterval(interval);
			clearTimeout(timeout);
		};
	}, [chatId, enabled]);

	const sendMessage = useCallback((content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') => {
		if (!chatId) throw new Error('No chat selected');
		if (!webSocketService.isConnected()) throw new Error('WebSocket not connected');
		webSocketService.sendMessage(chatId, { content, type });
	}, [chatId]);

	const sendTyping = useCallback((isTyping: boolean) => {
		if (!chatId || !webSocketService.isConnected()) return;
		webSocketService.sendTyping(chatId, isTyping);
	}, [chatId]);

	return { sendMessage, sendTyping, isConnected: isInitializedRef.current };
}