import api from '../api';
import type { AuthResponse, SignInRequest, SignUpRequest, UserProfile } from './auth.types';

class AuthService {
	async getProfile(): Promise<UserProfile> {
		const response = await api.get<UserProfile>('/users/me');
		return response.data;
	}

	async signUp(data: SignUpRequest): Promise<UserProfile> {
		const response = await api.post<UserProfile>('/auth/signup', data);
		return response.data;
	}

	async signIn(data: SignInRequest): Promise<AuthResponse> {
		const response = await api.post<AuthResponse>('/auth/signin-local', data);
		const { accessToken } = response.data;

		localStorage.setItem('accessToken', accessToken);

		return response.data;
	}

	async refreshToken(): Promise<AuthResponse> {
		const response = await api.post<AuthResponse>('/auth/refresh');
		const { accessToken } = response.data;

		localStorage.setItem('accessToken', accessToken);

		return response.data;
	}

	async logout(): Promise<void> {
		try {
			await api.post('/auth/logout');
		} catch (e) {
			console.error('Logout request failed', e);
		} finally {
			localStorage.removeItem('accessToken');
		}
	}

	getAccessToken(): string | null {
		return localStorage.getItem('accessToken');
	}

	isAuthenticated(): boolean {
		return !!this.getAccessToken();
	}
}

export default new AuthService();