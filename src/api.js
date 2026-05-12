import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chat_app_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function getPayload(response) {
  return response.data?.data ?? {};
}

export async function register(data) {
  const response = await api.post('/auth/register', data);
  return getPayload(response);
}

export async function login(data) {
  const response = await api.post('/auth/login', data);
  return getPayload(response);
}

export async function fetchChats() {
  const response = await api.get('/chat');
  return getPayload(response);
}

export async function fetchUsers() {
  const response = await api.get('/users');
  return getPayload(response);
}

export async function createChat(participantId) {
  const response = await api.post('/chat', { participantId });
  return getPayload(response);
}

export async function fetchMessages(chatId) {
  const response = await api.get(`/chat/${chatId}/messages`);
  return getPayload(response);
}
