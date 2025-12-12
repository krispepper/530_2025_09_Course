import { apiClient } from "../apiClient.js";

export const adminEnrollmentService = {
  async getAllCourses() {
    return apiClient.get("/api/courses");
  },

  async enrollStudent(courseId, studentEmail) {
    return apiClient.post(`/api/courses/${courseId}/enroll`, {
      studentEmail
    });
  },

  async removeStudent(courseId, studentEmail) {
    return apiClient.post(`/api/courses/${courseId}/remove`, {
      studentEmail
    });
  }
};
