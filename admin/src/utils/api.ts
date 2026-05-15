/**
 * Centralized API utility to interact with the Django backend.
 * Because we configured the Vite proxy, we can just fetch to '/api/...'
 * and it will automatically go to http://127.0.0.1:8000/api/...
 *
 * Auto-refresh: On any 401, we try to refresh the JWT access token using
 * the stored refresh_token. If that also fails, we clear storage and
 * redirect to login — permanently stopping 401 spam.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? '' 
    : 'https://donation-admin-panel.onrender.com'
);

export const getWSUrl = (path: string) => {
  const token = localStorage.getItem('access_token');
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  
  // If we have a hardcoded API_BASE_URL (like on Render), use its host
  const host = API_BASE_URL 
    ? API_BASE_URL.replace(/^https?:\/\//, '') 
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `${window.location.hostname}:8000` 
        : 'donation-admin-panel.onrender.com'); // Default to production backend

  return `${protocol}://${host}${path}${path.includes('?') ? '&' : '?'}token=${token}`;
};

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onRefreshed(newToken: string | null) {
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

// --- In-flight request deduplication and caching ---
const inflightRequests = new Map<string, Promise<any>>();
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5000; // 5 seconds cache for identical GET requests

export const fetchAPI = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = `${method}:${endpoint}:${options.body ? JSON.stringify(options.body) : ''}`;

  // 1. Check cache for GET requests
  if (method === 'GET' && cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    if (Date.now() < entry.expiry) {
      return entry.data;
    }
    cache.delete(cacheKey);
  }

  // 2. Check for in-flight requests (deduplication)
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
      const headers = new Headers(options.headers || {});
      const isSafeMethod = ['GET', 'HEAD'].includes(method);

      if (!isSafeMethod && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      const token = localStorage.getItem('access_token');
      if (token && token !== 'null' && token !== 'undefined' && token.length > 10) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      if (import.meta.env.DEV) {
        console.log(`[fetchAPI] Requesting: ${endpoint}`, { method, hasToken: !!token });
      }

      const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      const response = await fetch(fullUrl, { ...options, headers });

      if (response.status === 401) {
        // Handle token refresh logic...
        // (Moving the existing refresh logic inside this promise)
        if (!localStorage.getItem('refresh_token')) {
          throw new Error('Authentication required. Please log in.');
        }

        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          onRefreshed(newToken);

          if (!newToken) throw new Error('Session expired. Please log in again.');

          const retryHeaders = new Headers(options.headers || {});
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          const retryRes = await fetch(fullUrl, { ...options, headers: retryHeaders });
          if (!retryRes.ok) throw new Error('Request failed after token refresh.');
          
          const result = retryRes.status === 204 ? null : await retryRes.json();
          if (method === 'GET') cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });
          return result;
        } else {
          return new Promise((resolve, reject) => {
            refreshSubscribers.push(async (newToken: string | null) => {
              if (!newToken) return reject(new Error('Session expired.'));
              try {
                const h = new Headers(options.headers || {});
                h.set('Authorization', `Bearer ${newToken}`);
                const r = await fetch(fullUrl, { ...options, headers: h });
                resolve(r.status === 204 ? null : await r.json());
              } catch (e) { reject(e); }
            });
          });
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(String(errorData.error || errorData.detail || 'API Request failed'));
      }

      if (response.headers.get('Content-Type')?.includes('application/pdf')) {
        return response.blob();
      }

      const result = response.status === 204 ? null : await response.json();
      
      // 3. Cache the result for GET requests
      if (method === 'GET') {
        cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });
      }

      return result;
    } finally {
      // 4. Remove from in-flight requests once done
      inflightRequests.delete(cacheKey);
    }
  })();

  inflightRequests.set(cacheKey, requestPromise);
  return requestPromise;
};
