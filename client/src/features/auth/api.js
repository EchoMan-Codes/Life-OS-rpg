import { api, refreshAccessToken } from '@/lib/axios';

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
 * Uses the single-flight refreshAccessToken manager to avoid race conditions.
 *
 * @returns {Promise<{ user: object, accessToken: string }>}
 */
export async function refreshToken() {
  return refreshAccessToken();
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

/**
 * Request password reset email or token.
 *
 * @param {{ email: string }} payload
 * @returns {Promise<{ message: string, previewUrl?: string }>}
 */
export async function forgotPassword(payload) {
  const { data } = await api.post('/auth/forgot-password', payload);
  return data.data;
}

/**
 * Reset password using token.
 *
 * @param {{ token: string, newPassword: string }} payload
 * @returns {Promise<{ message: string }>}
 */
export async function resetPassword(payload) {
  const { data } = await api.post('/auth/reset-password', payload);
  return data.data;
}

/**
 * Update authenticated user profile.
 *
 * @param {object} profileData
 * @returns {Promise<{ user: object }>}
 */
export async function updateUserProfile(profileData) {
  const { data } = await api.patch('/auth/profile', profileData);
  return data.data;
}

/**
 * Reset RPG progression back to Level 1.
 *
 * @returns {Promise<{ stats: object }>}
 */
export async function resetUserAccount() {
  const { data } = await api.post('/auth/reset-account');
  return data.data;
}

/**
 * Permanently delete user account and all data.
 *
 * @param {{ confirmation: string }} payload
 * @returns {Promise<{ message: string }>}
 */
export async function deleteUserAccount(payload) {
  const { data } = await api.delete('/auth/account', { data: payload });
  return data.data;
}

