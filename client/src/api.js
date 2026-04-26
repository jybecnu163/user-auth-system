import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 评论相关API
export const getComments = (articleId) => api.get(`/api/comments/${articleId}`);
export const postComment = (articleId, content) => api.post('/api/comments', { articleId, content });

// Ollama相关API
export const getOllamaModels = () => api.get('/api/ollama/models');
export const ollamaGenerate = (model, prompt, system = '') => api.post('/api/ollama/generate', { model, prompt, system });

// Ollama 会话管理 API
export const getSessions = () => api.get('/api/ollama/sessions');
export const getSession = (sessionId) => api.get(`/api/ollama/sessions/${sessionId}`);
export const createSession = (title) => api.post('/api/ollama/sessions', { title });
export const addMessageToSession = (sessionId, role, content) =>
  api.post(`/api/ollama/sessions/${sessionId}/messages`, { role, content });


// 文章管理 API
export const getPosts = () => api.get('/api/posts');
export const getPost = (postId) => api.get(`/api/posts/${postId}`);
export const createPost = (title, content) => api.post('/api/posts', { title, content });


// 会话管理扩展
export const updateSessionTitle = (sessionId, title) => api.put(`/api/ollama/sessions/${sessionId}`, { title });
export const deleteSession = (sessionId) => api.delete(`/api/ollama/sessions/${sessionId}`);


// MySQL 数据库查询
export const testMySQLConnection = (config) => api.post('/api/mysql/connect', config);
export const getMySQLTables = (config) => api.post('/api/mysql/tables', config);
export const executeMySQLQuery = (config) => api.post('/api/mysql/query', config);

// 数据库连接管理
export const getDbConnections = () => api.get('/api/db-connections');
export const saveDbConnection = (data) => api.post('/api/db-connections', data);
export const deleteDbConnection = (id) => api.delete(`/api/db-connections/${id}`);

export default api;
