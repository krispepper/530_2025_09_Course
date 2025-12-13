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

<<<<<<< Updated upstream
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
=======
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

  getResults(evaluationId) {
    return request(`/api/evaluations/${encodeURIComponent(evaluationId)}/results`, {
      method: "GET"
    });
  },

  submitEvaluation(evaluationId, payload) {
    return request(`/api/evaluations/${encodeURIComponent(evaluationId)}/submit`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
>>>>>>> Stashed changes

  getMyResponse(evaluationId) {
    return request(`/api/evaluations/${encodeURIComponent(evaluationId)}/my-response`, {
      method: "GET"
    });
  }
<<<<<<< Updated upstream
};
=======
};
>>>>>>> Stashed changes
