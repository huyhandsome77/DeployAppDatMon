// Generic API Client with Auth Token Integration
import { API_BASE_URL, TOKEN_KEY } from './config.js';

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const rawText = await response.text();

  let data = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      data = { message: rawText };
    }
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP error! Status: ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}
