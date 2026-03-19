import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `https://api.gerspis-selection.com`;
  }
  return 'https://api.gerspis-selection.com';
};

const API_URL = getApiUrl();

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
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    const data = await res.json();
    if (data.token) await setToken(data.token);
    return data;
  },
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) await setToken(data.token);
    return data;
  },
  getQuiz: async () => {
    const res = await fetch(`${API_URL}/api/quiz`, {
      headers: await authHeaders(),
    });
    return res.json();
  },
  submitAnswer: async (questionId, answerIndex) => {
    const res = await fetch(`${API_URL}/api/quiz/answer`, {
      method: 'POST', headers: await authHeaders(),
      body: JSON.stringify({ questionId, answerIndex }),
    });
    return res.json();
  },
  getTip: async () => {
    const res = await fetch(`${API_URL}/api/tips`, {
      headers: await authHeaders(),
    });
    return res.json();
  },
  getAssets: async () => {
    const res = await fetch(`${API_URL}/api/assets`, {
      headers: await authHeaders(),
    });
    return res.json();
  },
  simulate: async (years, totalBudget, allocation) => {
    const res = await fetch(`${API_URL}/api/simulate`, {
      method: 'POST', headers: await authHeaders(),
      body: JSON.stringify({ years, totalBudget, allocation }),
    });
    return res.json();
  },
  getUser: async (email) => {
    const res = await fetch(`${API_URL}/api/user/${email}`, {
      headers: await authHeaders(),
    });
    return res.json();
  },
  logout: async () => {
    await setToken(null);
  },
};
