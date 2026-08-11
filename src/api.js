/* ------------------------------------------------------------------ */
/* API client for the Nsheera Node/Express backend (nsheera-backend). */
/*                                                                     */
/* Base URL: same pattern as the AI design/astro/rates calls already   */
/* in App.jsx — defaults to a same-origin relative path (works with    */
/* the Vite dev proxy and same-origin production deploys), overridable */
/* via VITE_API_BASE_URL for a backend hosted on a different origin.   */
/* ------------------------------------------------------------------ */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const TOKEN_KEY = 'nsheera_auth_token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) { /* localStorage unavailable — session just won't persist across reloads */ }
}

// Thrown for any non-2xx response. Carries the backend's message + HTTP status
// so callers can show a real error instead of a generic "something went wrong".
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, token, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  const authToken = token !== undefined ? token : getToken();
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new ApiError('Could not reach the server — check your connection and try again.', 0);
  }

  let payload = null;
  try { payload = await res.json(); } catch (e) { /* empty/non-JSON body */ }

  if (!res.ok) {
    throw new ApiError(payload?.message || `Request failed (HTTP ${res.status})`, res.status);
  }
  return payload;
}

/* ---------------- auth ---------------- */

export const auth = {
  signup: ({ name, email, phone, password }) =>
    request('/auth/signup', { method: 'POST', body: { name, email, phone, password } }),
  login: ({ email, password }) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => request('/auth/me', { token }),
  changePassword: ({ currentPassword, newPassword }) =>
    request('/auth/change-password', { method: 'PUT', body: { currentPassword, newPassword } }),
};

/* ---------------- client (own account) ---------------- */

export const client = {
  dashboard: () => request('/client/dashboard'),
  getProfile: () => request('/client/profile'),
  updateProfile: (fields) => request('/client/profile', { method: 'PUT', body: fields }),
};

/* ---------------- jewellery catalog ---------------- */

export const jewellery = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/jewellery${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/jewellery/${id}`),
  create: (payload) => request('/jewellery', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/jewellery/${id}`, { method: 'PUT', body: payload }),
  remove: (id) => request(`/jewellery/${id}`, { method: 'DELETE' }),
};

/* ---------------- orders ---------------- */

export const orders = {
  create: (payload) => request('/orders', { method: 'POST', body: payload }),
  list: (all = false) => request(`/orders${all ? '?all=true' : ''}`),
  get: (id) => request(`/orders/${id}`),
  updateStatus: (id, orderStatus) => request(`/orders/${id}/status`, { method: 'PUT', body: { orderStatus } }),
};

/* ---------------- payments (Razorpay) ---------------- */

export const payments = {
  createOrder: (orderId) => request('/payments/create-order', { method: 'POST', body: { orderId } }),
  verify: (payload) => request('/payments/verify', { method: 'POST', body: payload }),
  refund: (paymentId, amount) => request(`/payments/${paymentId}/refund`, { method: 'POST', body: { amount } }),
};

/* ---------------- invoices ---------------- */

export const invoices = {
  list: (all = false) => request(`/invoices${all ? '?all=true' : ''}`),
  get: (id) => request(`/invoices/${id}`),
  pdfUrl: (id) => `${API_BASE_URL}/invoices/${id}/pdf`,
};

/* ---------------- admin: client CRM ---------------- */

export const admin = {
  listClients: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/clients${qs ? `?${qs}` : ''}`);
  },
  getClient: (userId) => request(`/admin/clients/${userId}`),
  setClientStatus: (userId, isActive) =>
    request(`/admin/clients/${userId}/status`, { method: 'PUT', body: { isActive } }),
};

export default { API_BASE_URL, getToken, setToken, ApiError, auth, client, jewellery, orders, payments, invoices, admin };
