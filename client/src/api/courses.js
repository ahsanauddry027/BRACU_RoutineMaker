import axios from 'axios';
import { API_ROOT } from './base';

const API_BASE = `${API_ROOT}/api/courses`;

// ─── External Course Catalog (USIS) ────────────────────────
export async function fetchCourseCatalog() {
  const response = await axios.get(`${API_BASE}/catalog`);
  return response.data;
}

export async function searchCourses(query) {
  const response = await axios.get(`${API_BASE}/catalog/search`, {
    params: { q: query },
  });
  return response.data;
}

export async function getCoursesByDepartment(deptCode) {
  const response = await axios.get(`${API_BASE}/catalog/dept/${deptCode}`);
  return response.data;
}

export async function getCacheInfo() {
  const response = await axios.get(`${API_BASE}/catalog/cache-info`);
  return response.data;
}

export async function refreshCatalogCache() {
  const response = await axios.post(`${API_BASE}/catalog/refresh`);
  return response.data;
}

// ─── Custom Courses (MongoDB) ──────────────────────────────
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
