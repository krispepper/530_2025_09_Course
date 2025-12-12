export const evaluationListService = {
  async getMyEvaluations() {
    const res = await fetch("/api/evaluations", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, data };
    return data;
  }
};