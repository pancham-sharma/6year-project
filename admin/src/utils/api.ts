/**
 * Centralized API utility to interact with the Django backend.
 * Because we configured the Vite proxy, we can just fetch to '/api/...'
 * and it will automatically go to http://127.0.0.1:8000/api/...
 *
 * Auto-refresh: On any 401, we try to refresh the JWT access token using
 * the stored refresh_token. If that also fails, we clear storage and
 * redirect to login — permanently stopping 401 spam.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? '' : 'https://donation-admin-panel.onrender.com');

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
      window.location.reload(); // Admin uses state-based auth, reload triggers login screen
      return null;
    }

    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
  } catch {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.reload();
    return null;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export const fetchAPI = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const headers = new Headers(options.headers || {});

  const isSafeMethod = ['GET', 'HEAD'].includes((options.method || 'GET').toUpperCase());

  if (!isSafeMethod && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('access_token');
  // Only set Authorization if token exists and is a non-empty, non-null-string value
  if (token && token !== 'null' && token !== 'undefined' && token.length > 10) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Diagnostic logging
  console.log(`[fetchAPI] Requesting: ${endpoint}`, {
    method: options.method || 'GET',
    hasToken: !!token && token !== 'null'
  });

  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(fullUrl, { ...options, headers });


  if (response.status === 400) {
    const errorBody = await response.clone().text();
    console.error(`[fetchAPI] 400 Bad Request at ${endpoint}:`, errorBody);
  }

  // ── Auto-refresh on 401 ──────────────────────────────────────────────────
  if (response.status === 401) {
    if (!localStorage.getItem('refresh_token')) {
      throw new Error('Authentication required. Please log in.');
    }

    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (!newToken) {
        throw new Error('Session expired. Please log in again.');
      }

      onRefreshed(newToken);

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
      return new Promise((resolve, reject) => {
        refreshSubscribers.push(async (newToken: string) => {
          try {
            const retryHeaders = new Headers(options.headers || {});
            if (!retryHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
              retryHeaders.set('Content-Type', 'application/json');
            }
            retryHeaders.set('Authorization', `Bearer ${newToken}`);
            const retryResponse = await fetch(fullUrl, { ...options, headers: retryHeaders });
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
    throw new Error(errorData.detail || 'Something went wrong with the API request');
  }

  if (response.headers.get('Content-Type')?.includes('application/pdf')) {
    return response.blob();
  }

  if (response.status === 204) return null;

  return response.json();
};
