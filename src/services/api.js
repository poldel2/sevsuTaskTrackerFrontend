import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://api.sevsutasktracker.ru';

const api = axios.create({
    baseURL: API_URL,
});

// Интерцептор для добавления токена в заголовки
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login'; // Перенаправление на логин при истёкшем токене
        }
        return Promise.reject(error.response?.data || error.message);
    }
);

export const getProjects = async () => {
    const response = await api.get('/projects');
    return response.data;
};

export const getProject = async (projectId) => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
};


export const updateProject = async (projectId) => {
    const response = await api.put(`/projects/${projectId}`);
    return response.data;
};

export const getTasks = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
};

export const addTask = async (taskData, projectId) => {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    return response.data;
};

export const addProject = async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
};

export const updateTask = async (taskId, projectId, updateData) => {
    const response = await api.patch(`/projects/${projectId}/tasks/${taskId}`, updateData);
    return response.data;
};

export const getMessages = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/chat/messages`);
    return response.data;
};

export const loginLocal = async (email, password) => {
    const response = await api.post('/login/local', { email, password });
    return response.data;
};

export const register = async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get('/me');
    return response.data;
};

export const logout = async () => {
    await api.post('/logout');
};

export const addUserToProject = async (projectId, userId, role) => {
    const response = await api.post(`/projects/${projectId}/users/${userId}?role=${role}`);
    return response.data;
};

export const getColumns = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/columns`);
    return response.data;
};

export const createColumn = async (projectId, columnData) => {
    const response = await api.post(`/projects/${projectId}/columns`, columnData);
    return response.data;
};

export const updateColumn = async (projectId, columnId, columnData) => {
    const response = await api.put(`/projects/${projectId}/columns/${columnId}`, columnData);
    return response.data;
};

export const deleteColumn = async (projectId, columnId) => {
    const response = await api.delete(`/projects/${projectId}/columns/${columnId}`);
    return response.data;
};

export const getProjectUsers = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    return await response.data;
};

export const searchUsers = async (query) => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) throw new Error('Failed to search users');
    return await response.json();
};


export default api;
