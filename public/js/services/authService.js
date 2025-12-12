const API_BASE = "/api/auth";

export const authService = {
  async login(email, password) {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.user;
  },

  async register({ email, password, role }) {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, role })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.user;
  },

  async logout() {
    await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include"
    });
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/me`, {
      credentials: "include"
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  }
};
