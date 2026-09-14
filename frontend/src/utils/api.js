const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    googleLogin: (token) =>
      request("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    devLogin: () =>
      request("/api/auth/dev-login", {
        method: "POST",
      }),
    getUser: (userId) => request(`/api/auth/user/${userId}`),
  },

  payments: {
    createOrder: (amount, userId) =>
      request("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ amount, userId }),
      }),
    verify: (paymentPayload) =>
      request("/api/payments/verify", {
        method: "POST",
        body: JSON.stringify(paymentPayload),
      }),
  },

  ask: {
    seekGuidance: (userId, question, tradition) =>
      request("/api/ask", {
        method: "POST",
        body: JSON.stringify({ userId, question, tradition }),
      }),
  },

  journal: {
    getHistory: (userId) => request(`/api/journal/${userId}`),
    deleteEntry: (journalId) =>
      request(`/api/journal/${journalId}`, {
        method: "DELETE",
      }),
  },

  system: {
    keepAlive: () => request("/keep-alive"),
  },
};
