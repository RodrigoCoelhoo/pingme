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

