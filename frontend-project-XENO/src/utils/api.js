const API_ROOT =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api/v1' : 'http://localhost:5000/api/v1');
const AUTH_BASE = `${API_ROOT}/auth`;

export const getSessionTokens = () => {
  return {
    accessToken: localStorage.getItem('xeno_access_token'),
    refreshToken: localStorage.getItem('xeno_refresh_token'),
  };
};

export const setSessionTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('xeno_access_token', accessToken);
  if (refreshToken) localStorage.setItem('xeno_refresh_token', refreshToken);
};

export const clearSessionTokens = () => {
  localStorage.removeItem('xeno_access_token');
  localStorage.removeItem('xeno_refresh_token');
};

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (accessToken) => {
  refreshSubscribers.forEach((cb) => cb(accessToken));
  refreshSubscribers = [];
};

async function baseRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const { accessToken } = getSessionTokens();
  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    const error = new Error(
      'Cannot reach the API server. Make sure the backend is running (port 5000) and try again.'
    );
    error.status = 0;
    throw error;
  }

  if (response.status === 204) {
    return { success: true };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.detail || data.message || data.title || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiRequest(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    return await baseRequest(url, options);
  } catch (error) {
    const { refreshToken } = getSessionTokens();
    if (error.status === 401 && refreshToken && !options._retry) {
      options._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshData = await baseRequest(`${AUTH_BASE}/refresh`, {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshData.success && refreshData.accessToken) {
            setSessionTokens(refreshData.accessToken, refreshData.refreshToken);
            onTokenRefreshed(refreshData.accessToken);
            isRefreshing = false;
          } else {
            throw new Error('Refresh failed');
          }
        } catch (refreshErr) {
          clearSessionTokens();
          isRefreshing = false;
          window.dispatchEvent(new Event('xeno_auth_expired'));
          throw refreshErr;
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newAccessToken) => {
          const retryOptions = {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          };
          resolve(baseRequest(url, retryOptions));
        });
        setTimeout(() => reject(error), 15000);
      });
    }
    throw error;
  }
}

// Authentication API
export const authAPI = {
  signup: (userData) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  verifyEmail: (token) =>
    apiRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'POST',
    }),

  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () =>
    apiRequest('/auth/me', {
      method: 'GET',
    }),

  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, password) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }).finally(() => {
      clearSessionTokens();
    }),

  logoutAll: () =>
    apiRequest('/auth/logout-all', {
      method: 'POST',
    }).finally(() => {
      clearSessionTokens();
    }),
};

export const workspaceAPI = {
  list: () => apiRequest('/workspaces', { method: 'GET' }),
  create: (data) => apiRequest('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => apiRequest(`/workspaces/${id}`, { method: 'GET' }),
  patch: (id, data) => apiRequest(`/workspaces/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  duplicate: (id) => apiRequest(`/workspaces/${id}/duplicate`, { method: 'POST' }),
  delete: (id) => apiRequest(`/workspaces/${id}`, { method: 'DELETE' }),
};

export const customerAPI = {
  list: (wsId, query = '') => apiRequest(`/workspaces/${wsId}/customers${query}`, { method: 'GET' }),
  get: (wsId, custId) => apiRequest(`/workspaces/${wsId}/customers/${custId}`, { method: 'GET' }),
  filter: (wsId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.search) params.set('search', filters.search);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.order) params.set('order', filters.order);
    if (filters.status) params.set('status', filters.status);
    if (filters.city) params.set('city', filters.city);
    if (filters.channel) params.set('channel', filters.channel);
    if (filters.spendMin) params.set('spendMin', String(filters.spendMin));
    if (filters.spendMax) params.set('spendMax', String(filters.spendMax));
    if (filters.ordersMin) params.set('ordersMin', String(filters.ordersMin));
    if (filters.ordersMax) params.set('ordersMax', String(filters.ordersMax));
    if (filters.lastPurchaseWithin) params.set('lastPurchaseWithin', String(filters.lastPurchaseWithin));
    if (filters.lastPurchaseOver) params.set('lastPurchaseOver', String(filters.lastPurchaseOver));
    if (filters.segmentId) params.set('segmentId', filters.segmentId);
    const qs = params.toString();
    return apiRequest(`/workspaces/${wsId}/customers${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
};

export const segmentAPI = {
  list: (wsId) => apiRequest(`/workspaces/${wsId}/segments`, { method: 'GET' }),
  create: (wsId, data) => apiRequest(`/workspaces/${wsId}/segments`, { method: 'POST', body: JSON.stringify(data) }),
  preview: (wsId, rules, page = 1, limit = 25) =>
    apiRequest(`/workspaces/${wsId}/segments/preview`, {
      method: 'POST',
      body: JSON.stringify({ rules, page, limit }),
    }),
};

export const campaignAPI = {
  list: (wsId, query = '') => apiRequest(`/workspaces/${wsId}/campaigns${query}`, { method: 'GET' }),
  create: (wsId, data) => apiRequest(`/workspaces/${wsId}/campaigns`, { method: 'POST', body: JSON.stringify(data) }),
};

export const analyticsAPI = {
  getOverview: (wsId) => apiRequest(`/workspaces/${wsId}/analytics/overview`, { method: 'GET' }),
};

export const simulatorAPI = {
  getLogs: (wsId, query = '') => apiRequest(`/workspaces/${wsId}/campaigns/simulator/logs${query}`, { method: 'GET' }),
  getMetrics: (wsId) => apiRequest(`/workspaces/${wsId}/campaigns/simulator/metrics`, { method: 'GET' }),
  control: (wsId, settings) =>
    apiRequest(`/workspaces/${wsId}/campaigns/simulator/control`, {
      method: 'POST',
      body: JSON.stringify(settings),
    }),
};

export const copilotAPI = {
  listConversations: (wsId) => apiRequest(`/workspaces/${wsId}/chats/conversations`, { method: 'GET' }),
  createConversation: (wsId, title) =>
    apiRequest(`/workspaces/${wsId}/chats/conversations`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  sendMessage: (wsId, convId, text) =>
    apiRequest(`/workspaces/${wsId}/chats/conversations/${convId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};

export const notificationAPI = {
  list: (wsId, query = '') => apiRequest(`/workspaces/${wsId}/notifications${query}`, { method: 'GET' }),
  unreadCount: (wsId) => apiRequest(`/workspaces/${wsId}/notifications/unread-count`, { method: 'GET' }),
  markRead: (wsId, ids) =>
    apiRequest(`/workspaces/${wsId}/notifications/read`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

export const importAPI = {
  uploadCsv: async (wsId, formData) => {
    const { accessToken } = getSessionTokens();
    const response = await fetch(`${API_ROOT}/workspaces/${wsId}/imports`, {
      method: 'POST',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || data.detail || 'Import failed');
      error.status = response.status;
      throw error;
    }
    return data;
  },
};
