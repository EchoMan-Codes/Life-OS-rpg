/**
 * Centralized API client module for Jeevan (Web, Android, iOS).
 * Re-exports the unified Axios instance, base URL, and token helpers.
 */
import {
  api,
  API_BASE_URL,
  getBaseUrl,
  setAccessToken,
  getAccessToken,
  refreshAccessToken,
  PRODUCTION_API_URL,
} from './axios.js';

export {
  api,
  API_BASE_URL,
  getBaseUrl,
  setAccessToken,
  getAccessToken,
  refreshAccessToken,
  PRODUCTION_API_URL,
};

export default api;
