export enum ContactStatus {
	PENDING = 'PENDING',
	ACCEPTED = 'ACCEPTED'
}

export enum ContactAction {
	ACCEPT = 'ACCEPT',
	REJECT = 'REJECT',
	CANCEL = 'CANCEL'
}

export enum PendingType {
	SENT = 'SENT',
	RECEIVED = 'RECEIVED'
}

export interface ContactResponse {
	contactId: string;
	userId: string;
	displayName: string;
	username: string;
	avatarUrl: string;
	status: ContactStatus;
	createdAt: string;
}