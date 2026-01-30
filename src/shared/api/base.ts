import axios from 'axios';

// URL сервера на Railway
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const $api = axios.create({
  baseURL: API_URL,
});

// Автоматически добавляем токен в каждый запрос
$api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});