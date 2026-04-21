export interface SignUpRequest {
	email: string;
	username: string;
	password: string;
	displayName?: string;
}

export interface SignInRequest {
	email: string;
	password: string;
}

export interface AuthResponse {
	accessToken: string;
}

export interface UserProfile {
	id: string;
	email: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
}