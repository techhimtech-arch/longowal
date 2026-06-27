import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Generate random UUID for logging correlation if not present
  if (!config.headers['X-Correlation-ID']) {
    config.headers['X-Correlation-ID'] = crypto.randomUUID();
  }
  return config;
});

// Intercept responses to handle 401 Token Expirations silently
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;

    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');

        // Request a new access token (calling axios directly to avoid infinite loop)
        const response = await axios.post('http://localhost:5000/api/v1/auth/refresh-token', {
          refreshToken,
        });

        // Backend response format: response.data.data.accessToken
        const newAccessToken = response.data.data.accessToken;
        const newRefreshToken = response.data.data.refreshToken;

        // Save new credentials
        localStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        // Retry the original failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Session expired. Logging out...', refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('ooms_user');
        
        // Use window redirect as fallback if routing isn't ready
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
