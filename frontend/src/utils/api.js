const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "";

/**
 * The server now issues an HttpOnly session cookie (see backend/middleware/auth.js) —
 * page JavaScript can't read it, which is the point: it can no longer be stolen by
 * an XSS bug the way a localStorage token could. `credentials: "include"` tells the
 * browser to send that cookie (and accept a new one) on every request, including
 * cross-origin ones when VITE_API_URL points at a different host than the frontend.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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
    adminLogin: (passcode) =>
      request("/api/auth/admin-login", {
        method: "POST",
        body: JSON.stringify({ passcode }),
      }),
    // Who am I, according to my session cookie? Used to restore a session on
    // page load without ever having to store the token in the browser.
    me: () => request("/api/auth/me"),
    logout: () =>
      request("/api/auth/logout", {
        method: "POST",
      }),
    getUser: (userId) => request(`/api/auth/user/${userId}`),
  },

  // NOTE: admin and ask calls below no longer take a userId or
  // admin key — the server derives who you are from your session cookie
  // (attached automatically by `request()` above), not from anything the
  // client claims. This closes the account-impersonation gaps that existed
  // when the backend trusted a client-supplied userId.
  admin: {
    getStats: () => request("/api/admin/stats"),
  },

  ask: {
    seekGuidance: (question, tradition) =>
      request("/api/ask", {
        method: "POST",
        body: JSON.stringify({ question, tradition }),
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
