import React, { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

type User = {
	id: string;
	_id?: string;
	name: string;
	firstName?: string;
	lastName?: string;
	role?: string;
	roleId?: string;
	email?: string;
	userType?: string;
};

type AuthContextType = {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		try {
			const raw = typeof window !== 'undefined' ? localStorage.getItem('ooms_user') : null;
			if (raw) {
				setUser(JSON.parse(raw));
			}
		} catch (e) {
			console.error('Failed to parse stored user', e);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const login = async (email: string, password: string) => {
		const response = await api.post('/auth/login', { email, password });
		const data = response.data?.data ?? response.data;
		const accessToken = data?.accessToken || data?.token;
		const refreshToken = data?.refreshToken;
		const userData = data?.user || data?.userData || data;

		if (accessToken) {
			localStorage.setItem('access_token', accessToken);
		}
		if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
		if (userData) {
			localStorage.setItem('ooms_user', JSON.stringify(userData));
			setUser(userData);
		}
	};

	const logout = async () => {
		const refreshToken = localStorage.getItem('refresh_token');
		if (refreshToken) {
			try {
				await api.post('/auth/logout', { refreshToken }, { skipToast: true } as any);
			} catch (err) {
				console.error('Backend logout failed', err);
			}
		}
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
		localStorage.removeItem('ooms_user');
		setUser(null);
	};

	const value: AuthContextType = {
		user,
		isAuthenticated: !!user,
		isLoading,
		login,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return ctx;
}
