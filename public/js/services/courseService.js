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

export const courseService = {
  getAllCourses() {
    return request("/api/courses", { method: "GET" });
  }
};
