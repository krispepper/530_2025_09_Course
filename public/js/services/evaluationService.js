async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const ct = res.headers.get("content-type") || "";

  let data = null;
  let text = null;

  try {
    if (ct.includes("application/json")) {
      data = await res.json();
    } else {
      text = await res.text();
    }
  } catch {
  }

  if (!res.ok) {
    const err = new Error(
      data?.message ||
        (text && text.trim() ? text.slice(0, 200) : `Request failed (${res.status})`)
    );
    err.status = res.status;
    err.data = data;
    err.text = text;
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
    return request(`/api/evaluations/${encodeURIComponent(evaluationId)}`, {
      method: "GET"
    });
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
  },

  listEvaluations() {
    return request("/api/evaluations", { method: "GET" });
  },

  getAllEvaluations() {
    return request("/api/evaluations", { method: "GET" });
  },

  getResults(evaluationId) {
    return request(`/api/evaluations/${encodeURIComponent(evaluationId)}/results`, {
      method: "GET"
    });
  },

  async getSubmissionByResponseId(evaluationId, responseId) {
    const res = await request(`/api/evaluations/${encodeURIComponent(evaluationId)}/results`, {
      method: "GET"
    });

    const responses = res?.responses || [];
    const found = responses.find((r) => String(r._id) === String(responseId));

    return { evaluation: res?.evaluation, response: found || null };
  }
};
