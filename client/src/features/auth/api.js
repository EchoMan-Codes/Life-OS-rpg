import { api } from '@/lib/axios';

/**
 * Log in with email and password.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ user: object, accessToken: string }>}
 */
export async function loginUser(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data.data;
}

/**
 * Register a new user.
 *
 * @param {{ email: string, password: string, displayName: string }} userData
 * @returns {Promise<{ user: object, accessToken: string }>}
 */
export async function registerUser(userData) {
  const { data } = await api.post('/auth/register', userData);
  return data.data;
}

/**
 * Manually trigger refresh token rotation to obtain a new access token.
 *
 * @returns {Promise<{ user: object, accessToken: string }>}
 */
export async function refreshToken() {
  const { data } = await api.post('/auth/refresh');
  return data.data;
}

/**
 * Log out and invalidate the refresh token.
 */
export async function logoutUser() {
  const { data } = await api.post('/auth/logout');
  return data.data;
}

/**
 * Fetch the authenticated user's profile.
 *
 * @returns {Promise<{ user: object }>}
 */
export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.data;
}
