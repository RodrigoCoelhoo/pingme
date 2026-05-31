import { createContext, useContext, useState, useEffect, type ReactNode, useMemo } from 'react';
import authService from '../services/auth/auth.service';
import api from '../services/api';
import type { UserProfile } from '../services/user/user.types';

interface AuthContextType {
	user: UserProfile | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (
		email: string,
		username: string,
		password: string,
		displayName: string
	) => Promise<void>;
	signOut: () => void;
	refreshUser: () => Promise<void>;
	updateUser: (user: UserProfile) => void;
	handleOAuthCallback: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchUserProfile = async () => {
		try {
			const response = await api.get<UserProfile>('/users/me');
			setUser(response.data);
		} catch (error: any) {
			if (error.status === 401) {
				authService.logout();
				setUser(null);
			} else {
				console.error('Failed to fetch user profile:', error);
			}
		}
	};

	useEffect(() => {
		const initializeAuth = async () => {
			const token = authService.getAccessToken();

			if (token) {
				await fetchUserProfile();
			}

			setIsLoading(false);
		};

		initializeAuth();
	}, []);

	// Sync logout/login across tabs
	useEffect(() => {
		const handleStorageChange = () => {
			const token = authService.getAccessToken();
			if (!token) {
				setUser(null);
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	const signIn = async (email: string, password: string) => {
		await authService.signIn({ email, password });
		await fetchUserProfile();
	};

	const signUp = async (
		email: string,
		username: string,
		password: string,
		displayName: string
	) => {
		await authService.signUp({ email, username, password, displayName });
		await signIn(email, password);
	};

	const signOut = () => {
		authService.logout();
		setUser(null);
	};

	const refreshUser = async () => {
		await fetchUserProfile();
	};

	const updateUser = (updatedUser: UserProfile) => {
		setUser(updatedUser);
	};

	const handleOAuthCallback = async (token: string) => {
		localStorage.setItem('accessToken', token)
		await fetchUserProfile()
	}

	const value: AuthContextType = useMemo(() => ({
		user,
		isAuthenticated: !!user,
		isLoading,
		signIn,
		signUp,
		signOut,
		refreshUser,
		updateUser,
		handleOAuthCallback,
	}), [user, isLoading]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
