import axios from 'axios';
import { supabase } from '../utils/supabaseClient';
const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signUp: (email, password) => api.post('/auth/signup', { email, password }),
  signIn: (email, password) => api.post('/auth/signin', { email, password }),
  signOut: () => api.post('/auth/signout'),
  getCurrentUser: () => api.get('/auth/user'),
};

// Images API
export const imagesAPI = {
  upload: (formData) => api.post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (page = 1, limit = 20) => api.get(`/images?page=${page}&limit=${limit}`),
  getOne: (id) => api.get(`/images/${id}`),
  delete: (id) => api.delete(`/images/${id}`),
};

// Search API
export const searchAPI = {
  text: (query, page = 1, limit = 20) => api.get(`/search/text?q=${query}&page=${page}&limit=${limit}`),
  similar: (id, page = 1, limit = 20) => api.get(`/search/similar/${id}?page=${page}&limit=${limit}`),
  color: (color, page = 1, limit = 20) => api.get(`/search/color?c=${color}&page=${page}&limit=${limit}`),
};

export default api;