/**
 * Centralized API utility to interact with the Django backend.
 * Because we configured the Vite proxy, we can just fetch to '/api/...'
 * and it will automatically go to http://127.0.0.1:8000/api/...
 *
 * Auto-refresh: On any 401, we try to refresh the JWT access token using
 * the stored refresh_token. If that also fails, we clear storage and
 * redirect to /auth — permanently stopping 401 spam.
 */

export const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '' 
  : 'https://donation-admin-panel.onrender.com';

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/users/login/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      // Refresh token itself is expired — force logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.hash = '#/auth';
      return null;
    }

    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
  } catch {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.hash = '#/auth';
    return null;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export const fetchAPI = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('access_token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(fullUrl, { ...options, headers });

  // ── Auto-refresh on 401 ──────────────────────────────────────────────────
  if (response.status === 401) {

    // Exempt login, register and social auth from global 401 message
    const isAuthEndpoint = endpoint.includes('login') || endpoint.includes('register') || endpoint.includes('auth');
    if (!localStorage.getItem('refresh_token') && !isAuthEndpoint) {
      throw new Error('Please Login First');
    }

    // For auth endpoints, don't try to refresh, just throw the error
    if (isAuthEndpoint) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || 'Authentication failed');
    }

    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (!newToken) {
        throw new Error('Session Expired. Please Login First');
      }

      onRefreshed(newToken);

      // Retry the original request with the new token
      const retryHeaders = new Headers(options.headers || {});
      if (!retryHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${newToken}`);

      const retryResponse = await fetch(fullUrl, { ...options, headers: retryHeaders });
      if (!retryResponse.ok) {
        const errData = await retryResponse.json().catch(() => ({}));
        throw new Error(errData.detail || 'Request failed after token refresh.');
      }
      if (retryResponse.status === 204) return null;
      if (retryResponse.headers.get('Content-Type')?.includes('application/pdf')) {
        return retryResponse.blob();
      }
      return retryResponse.json();
    } else {
      // Another request is already refreshing — queue this one
      return new Promise((resolve, reject) => {
        refreshSubscribers.push(async (newToken: string) => {
          try {
            const retryHeaders = new Headers(options.headers || {});
            if (!retryHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
              retryHeaders.set('Content-Type', 'application/json');
            }
            retryHeaders.set('Authorization', `Bearer ${newToken}`);
            const retryResponse = await fetch(endpoint, { ...options, headers: retryHeaders });
            if (!retryResponse.ok) {
              const errData = await retryResponse.json().catch(() => ({}));
              reject(new Error(errData.detail || 'Request failed.'));
            } else {
              resolve(retryResponse.status === 204 ? null : retryResponse.json());
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  }
  // ── End auto-refresh ─────────────────────────────────────────────────────

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle Django Rest Framework field-specific errors
    let errorMessage = errorData.detail || errorData.error || errorData.message;

    if (!errorMessage && typeof errorData === 'object') {
      const firstKey = Object.keys(errorData)[0];
      if (firstKey) {
        const firstError = errorData[firstKey];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        // Capitalize field name for better readability
        errorMessage = `${firstKey.charAt(0).toUpperCase() + firstKey.slice(1)}: ${errorMessage}`;
      }
    }

    throw new Error(errorMessage || `Error: ${response.status}`);
  }

  if (response.headers.get('Content-Type')?.includes('application/pdf')) {
    return response.blob();
  }

  if (response.status === 204) return null;

  return response.json();
};
