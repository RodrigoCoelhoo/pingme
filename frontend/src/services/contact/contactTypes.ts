export enum ContactStatus {
	PENDING = 'PENDING',
	ACCEPTED = 'ACCEPTED'
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