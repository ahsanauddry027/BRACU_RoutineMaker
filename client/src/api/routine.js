import axios from 'axios';

const API_BASE = '/api/routine';

/**
 * Fetch all routine entries from the server.
 */
export async function fetchRoutine() {
  const response = await axios.get(API_BASE);
  return response.data;
}

/**
 * Create a new routine entry.
 */
export async function createEntry(data) {
  const response = await axios.post(API_BASE, data);
  return response.data;
}

/**
 * Update an existing routine entry by ID.
 */
export async function updateEntry(id, data) {
  const response = await axios.put(`${API_BASE}/${id}`, data);
  return response.data;
}

/**
 * Delete a single routine entry by ID.
 */
export async function deleteEntry(id) {
  const response = await axios.delete(`${API_BASE}/${id}`);
  return response.data;
}

/**
 * Delete all routine entries (clear entire routine).
 */
export async function clearAllEntries() {
  const response = await axios.delete(API_BASE);
  return response.data;
}
