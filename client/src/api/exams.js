import axios from 'axios';
import { API_ROOT } from './base';

const API_BASE = `${API_ROOT}/api/exams`;

export async function fetchExams() {
  const response = await axios.get(API_BASE);
  return response.data;
}

export async function createExam(data) {
  const response = await axios.post(API_BASE, data);
  return response.data;
}

export async function updateExam(id, data) {
  const response = await axios.put(`${API_BASE}/${id}`, data);
  return response.data;
}

export async function deleteExam(id) {
  const response = await axios.delete(`${API_BASE}/${id}`);
  return response.data;
}

export async function clearAllExams() {
  const response = await axios.delete(API_BASE);
  return response.data;
}
