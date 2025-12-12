export const evaluationEnsureService = {
  async ensureForCourse(courseId) {
    const res = await fetch("/api/evaluations/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ courseId })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw { status: res.status, data };

    return data;
  }
};