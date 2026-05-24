export interface UpdateUserRequest {
	displayName?: string;
}

export interface UserProfile {
	id: string;
	email: string;
	username: string;
	displayName: string;
	avatarUrl: string | null;
}