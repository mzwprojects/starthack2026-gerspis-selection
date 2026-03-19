import Constants from 'expo-constants';

const getApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:3001`;
  }
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();

export const api = {
  register: async (email, password, displayName) => {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    return res.json();
  },
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },
  getQuiz: async () => {
    const res = await fetch(`${API_URL}/api/quiz`);
    return res.json();
  },
  submitAnswer: async (questionId, answerIndex, email) => {
    const res = await fetch(`${API_URL}/api/quiz/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answerIndex, email }),
    });
    return res.json();
  },
  getTip: async () => {
    const res = await fetch(`${API_URL}/api/tips`);
    return res.json();
  },
  getAssets: async () => {
    const res = await fetch(`${API_URL}/api/assets`);
    return res.json();
  },
  simulate: async (years, totalBudget, allocation, email) => {
    const res = await fetch(`${API_URL}/api/simulate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ years, totalBudget, allocation, email }),
    });
    return res.json();
  },
  getUser: async (email) => {
    const res = await fetch(`${API_URL}/api/user/${email}`);
    return res.json();
  },
};
