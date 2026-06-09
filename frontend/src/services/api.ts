import axios from 'axios';

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const api = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
});

api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('accessToken');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

const PUBLIC_ENDPOINTS = ["/auth/signin-local", "/auth/signup"];

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (PUBLIC_ENDPOINTS.some(ep => originalRequest.url?.includes(ep))) {
			return Promise.reject(error); 
		}

		// If error is 401 and we haven't tried to refresh yet
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				const response = await axios.post(
					`${API_URL}/auth/refresh`,
					{},
					{ withCredentials: true }
				);

				const { accessToken } = response.data;
				localStorage.setItem('accessToken', accessToken);

				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				return api(originalRequest);
			} 
			catch (refreshError) {
				localStorage.removeItem('accessToken');
				window.location.href = '/signin';
				return Promise.reject(refreshError);
			}
		}

		const normalizedError = {
			message: error.response?.data?.message || 'Unexpected error',
			status: error.response?.status,
			data: error.response?.data,
		};

		return Promise.reject(normalizedError);
	}
);

export default api;