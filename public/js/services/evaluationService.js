async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const err = new Error(data?.message || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const evaluationService = {
  ensureEvaluation(courseId) {
    return request("/api/evaluations/ensure", {
      method: "POST",
      body: JSON.stringify({ courseId })
    });
  },

  getEvaluation(evaluationId) {
    return request(`/api/evaluations/${encodeURIComponent(evaluationId)}`, { method: "GET" });
  },

  submitEvaluation(evaluationId, payload) {
    return request(`/api/evaluations/${encodeURIComponent(evaluationId)}/submit`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  getMyResponse(evaluationId) {
    return request(`/api/evaluations/${encodeURIComponent(evaluationId)}/my-response`, {
      method: "GET"
    });
  }
};