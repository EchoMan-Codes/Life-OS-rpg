import axios from 'axios';

let inMemoryAccessToken = null;
let activeRefreshPromise = null;

export function setAccessToken(token) {
  inMemoryAccessToken = token;
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

/**
 * Single-flight silent refresh manager.
 * Guarantees that only ONE /auth/refresh HTTP request is EVER in flight at any given time,
 * completely eliminating race conditions and unintended reuse-detection session revocations.
 *
 * @returns {Promise<{ accessToken: string, user: object }>}
 */
export async function refreshAccessToken() {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      // Use raw axios call to bypass interceptors
      const response = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const { accessToken, user } = response.data.data;
      setAccessToken(accessToken);
      return { accessToken, user };
    } catch (err) {
      setAccessToken(null);
      // Dispatch session-expired only if a previously valid token was rejected (not if cookie was simply missing)
      const errCode = err.response?.data?.error?.code;
      if (err.response?.status === 401 && errCode && errCode !== 'MISSING_REFRESH_TOKEN') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lifeos:session-expired'));
        }
      }
      throw err;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

// Request interceptor: Attach token, or await in-flight refresh before sending
api.interceptors.request.use(
  async (config) => {
    // Auth endpoints do not wait or attach bearer tokens
    if (
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh')
    ) {
      return config;
    }

    // If a silent refresh is currently in progress (e.g. during page startup recovery), await it!
    if (activeRefreshPromise) {
      try {
        const { accessToken } = await activeRefreshPromise;
        config.headers.Authorization = `Bearer ${accessToken}`;
        return config;
      } catch {
        // Refresh failed; proceed with request (will fail or handle accordingly)
      }
    } else if (inMemoryAccessToken) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Silent refresh & replay on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh attempts for non-401s, already retried requests, or auth endpoints themselves
    if (
      !error.response ||
      error.response.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { accessToken } = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);
