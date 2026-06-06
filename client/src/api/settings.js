import axios from 'axios';

const API_BASE = '/api/settings';

export async function fetchTimeSlots() {
  const response = await axios.get(`${API_BASE}/timeslots`);
  return response.data;
}

export async function updateTimeSlots(timeSlots) {
  const response = await axios.put(`${API_BASE}/timeslots`, { timeSlots });
  return response.data;
}

export async function resetTimeSlots() {
  const response = await axios.post(`${API_BASE}/timeslots/reset`);
  return response.data;
}
