const BASE_URL = "";

export const apiClient = {
  async get(url) {
    const res = await fetch(BASE_URL + url, {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  },

  async post(url, body) {
    const res = await fetch(BASE_URL + url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }
};
