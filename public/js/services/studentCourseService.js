import { apiClient } from "../apiClient.js";

export const studentCourseService = {
  async getMyEnrollments() {
    return apiClient.get("/api/courses"); 
  }
};
