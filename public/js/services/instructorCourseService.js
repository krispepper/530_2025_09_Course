const BASE_URL = "/api/courses";

export const instructorCourseService = {
  async getMyCourses() {
    return fetch(BASE_URL).then(res => res.json());
  },

  async createCourse(data) {
    return fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  async updateCourse(id, data) {
    return fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  async deleteCourse(id) {
    return fetch(`${BASE_URL}/${id}`, {
      method: "DELETE"
    }).then(res => res.json());
  }
};
