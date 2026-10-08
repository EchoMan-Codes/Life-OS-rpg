import { apiClient, getAccessToken, refreshAccessToken, getBaseUrl } from '@/lib/axios';

export const aiApi = {
  async chat({ message, history = [] }) {
    const res = await apiClient.post('/ai/chat', { message, history });
    return res.data.data;
  },

  /**
   * SSE Streaming Chat Helper with verified Jeevan authentication
   * and single-flight silent refresh recovery.
   */
  async streamChat({ message, history = [], onChunk, signal }) {
    let token = getAccessToken();

    // If no access token in memory/storage, attempt silent refresh first
    if (!token) {
      try {
        const refreshed = await refreshAccessToken();
        token = refreshed?.accessToken;
      } catch {
        const err = new Error('Please sign in to Jeevan to chat with your AI assistant.');
        err.code = 'AUTH_REQUIRED';
        throw err;
      }
    }

    const baseUrl = getBaseUrl();
    let response;

    try {
      response = await fetch(`${baseUrl}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ message, history }),
        signal,
      });
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') throw fetchErr;
      const netErr = new Error('Unable to connect to the Jeevan server. Please check your network.');
      netErr.code = 'NETWORK_ERROR';
      throw netErr;
    }

    // If 401 Unauthorized, token may have expired: attempt silent refresh once and retry
    if (response.status === 401) {
      try {
        const refreshed = await refreshAccessToken();
        token = refreshed?.accessToken;
        if (token) {
          response = await fetch(`${baseUrl}/ai/chat/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ message, history }),
            signal,
          });
        }
      } catch {
        const authErr = new Error('Please sign in to Jeevan to chat with your AI assistant.');
        authErr.code = 'AUTH_REQUIRED';
        throw authErr;
      }
    }

    if (!response.ok) {
      let errorMsg = `Server error ${response.status}`;
      let errorCode = 'SERVER_ERROR';
      try {
        const errJson = await response.json();
        errorMsg = errJson.error?.message || errJson.message || errorMsg;
        errorCode = errJson.error?.code || errorCode;
      } catch {
        // use fallback
      }

      if (response.status === 401) {
        errorCode = 'AUTH_REQUIRED';
        errorMsg = 'Please sign in to Jeevan to chat with your AI assistant.';
      }

      const err = new Error(errorMsg);
      err.code = errorCode;
      err.status = response.status;
      throw err;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');

        try {
          const parsed = JSON.parse(dataStr);
          onChunk(parsed);
        } catch {
          // ignore partial json
        }
      }
    }
  },

  async getHistory() {
    const res = await apiClient.get('/ai/history');
    return res.data.data;
  },

  async clearHistory() {
    const res = await apiClient.delete('/ai/history');
    return res.data.data;
  },

  async executeAction({ actionType, payload }) {
    const res = await apiClient.post('/ai/execute-action', { actionType, payload });
    return res.data.data;
  },

  async getContext() {
    const res = await apiClient.get('/ai/context');
    return res.data.data;
  },

  async exportTrainingData() {
    const res = await apiClient.get('/ai/export-training-data');
    return res.data;
  },

  async getStatus() {
    const res = await apiClient.get('/ai/status');
    return res.data.data;
  },
};
