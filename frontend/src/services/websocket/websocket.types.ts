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

export interface Event {
  type: EventType;
  chatId: string | null;
  contactId: string | null;
  payload: any;
}

export enum EventType {
  MEMBER_KICKED = 'MEMBER_KICKED',
  MEMBER_ROLE_UPDATED = 'MEMBER_ROLE_UPDATED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  DETAILS_UPDATED = 'DETAILS_UPDATED',
  MESSAGE_EDITED = "MESSAGE_EDITED",
  MESSAGE_DELETED = "MESSAGE_DELETED",
  CHAT_CREATED = 'CHAT_CREATED',
  CHAT_DELETED = 'CHAT_DELETED',
  CONTACT_RECEIVED = 'CONTACT_RECEIVED',
  CONTACT_ACCEPTED = 'CONTACT_ACCEPTED',
  CONTACT_REJECTED = 'CONTACT_REJECTED',
  CONTACT_CANCEL = 'CONTACT_CANCEL',
  CONTACT_DELETED = 'CONTACT_DELETED'
}