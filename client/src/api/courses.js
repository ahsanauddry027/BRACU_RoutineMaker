import axios from 'axios';

const API_BASE = '/api/courses';

export async function fetchCourses() {
  const response = await axios.get(API_BASE);
  return response.data;
}

export async function createCourse(data) {
  const response = await axios.post(API_BASE, data);
  return response.data;
}

export async function deleteCourse(id) {
  const response = await axios.delete(`${API_BASE}/${id}`);
  return response.data;
}
