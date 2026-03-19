import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `https://dev.api.gerspis-selection.com`;
  }
  return 'https://dev.api.gerspis-selection.com';
};

const API_URL = getApiUrl();
console.log('[API] Base URL:', API_URL);

// Helper: fetch with logging
const apiFetch = async (url, options = {}) => {
  console.log(`[API] ${options.method || 'GET'} ${url}`);
  try {
    const res = await fetch(url, options);
    console.log(`[API] Response: ${res.status} ${res.statusText}`);
    if (!res.ok) {
      const text = await res.text();
      console.error(`[API] Error body: ${text}`);
      try { return JSON.parse(text); } catch { return { detail: text }; }
    }
    return await res.json();
  } catch (err) {
    console.error(`[API] Network error for ${url}:`, err.message, err);
    throw err;
  }
};

// Token management
let authToken = null;

export const setToken = async (token) => {
  authToken = token;
  if (token) {
    await AsyncStorage.setItem('authToken', token);
  } else {
    await AsyncStorage.removeItem('authToken');
  }
};

export const getToken = async () => {
  if (!authToken) {
    authToken = await AsyncStorage.getItem('authToken');
  }
  return authToken;
};

const authHeaders = async () => {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  register: async (email, password, displayName) => {
    const data = await apiFetch(`${API_URL}/api/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    if (data.token) await setToken(data.token);
    return data;
  },
  login: async (email, password) => {
    const data = await apiFetch(`${API_URL}/api/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (data.token) await setToken(data.token);
    return data;
  },
  getQuiz: async () => {
    return apiFetch(`${API_URL}/api/quiz`, {
      headers: await authHeaders(),
    });
  },
  submitAnswer: async (questionId, answerIndex) => {
    return apiFetch(`${API_URL}/api/quiz/answer`, {
      method: 'POST', headers: await authHeaders(),
      body: JSON.stringify({ questionId, answerIndex }),
    });
  },
  getTip: async () => {
    return apiFetch(`${API_URL}/api/tips`, {
      headers: await authHeaders(),
    });
  },
  getAssets: async () => {
    return apiFetch(`${API_URL}/api/assets`, {
      headers: await authHeaders(),
    });
  },
  simulate: async (years, totalBudget, allocation) => {
    return apiFetch(`${API_URL}/api/simulate`, {
      method: 'POST', headers: await authHeaders(),
      body: JSON.stringify({ years, totalBudget, allocation }),
    });
  },
  getUser: async (email) => {
    return apiFetch(`${API_URL}/api/user/${email}`, {
      headers: await authHeaders(),
    });
  },
  logout: async () => {
    await setToken(null);
  },
};
