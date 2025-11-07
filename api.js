// src/api.js
import axios from 'axios';

// Vite면 VITE_API_BASE, CRA면 REACT_APP_API_BASE 사용
const baseURL =
  import.meta?.env?.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  'http://localhost:3001';

const api = axios.create({ baseURL });

// 로그인 이후 받은 토큰 저장/적용(선택)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

export default api;
