import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://api.sevsutasktracker.ru';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://api.sevsutasktracker.ru';

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


export const updateProject = async (projectId, projectData) => {
    const response = await api.put(`/projects/${projectId}`, projectData);
    return response.data;
};

export const uploadProjectLogo = async (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/projects/${projectId}/logo`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
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
    return await response.data;
};

export const approveTask = async (projectId, taskId, isTeacherApproval = false, comment = null) => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/approve`, {
        is_teacher_approval: isTeacherApproval,
        comment: comment
    });
    return response.data;
};

export const rejectTask = async (projectId, taskId, feedback) => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/reject`, {
        feedback: feedback
    });
    return response.data;
};

export const submitForReview = async (projectId, taskId) => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/submit-for-review`);
    return response.data;
};

export const getProjectParticipantsReport = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/reports/participants`);
    return response.data;
};

export const setParticipantManualGrade = async (projectId, userId, grade) => {
    const response = await api.post(`/projects/${projectId}/participants/${userId}/grade?grade=${grade}`);
    return response.data;
};

export const fetchTasks = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
};

export const updateTaskStatus = async (taskId, projectId, updateData) => {
    const response = await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, updateData);
    return response.data;
};

export const fetchTaskDetails = async (taskId, projectId) => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
};

export const deleteTask = async (taskId, projectId) => {
    const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
};

export const getActivities = async (projectId, filters = {}) => {
    const { page = 1, pageSize = 10, type, date, projectId: filteredProjectId } = filters;
    
    let url = `/projects/${projectId || ''}/activities?offset=${(page - 1) * pageSize}&limit=${pageSize}`;
    
    if (type && type !== 'all') {
        url += `&action=${type}`;
    }
    
    if (date && date.length === 2) {
        url += `&start_date=${date[0].toISOString()}&end_date=${date[1].toISOString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
}

// Notifications API
export const getNotifications = async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
    const response = await api.post(`/notifications/${notificationId}/read`);
    return response.data;
};

export const markAllNotificationsAsRead = async () => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
};

export const deleteNotification = async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
};

export const getNotificationsWebSocketUrl = () => {
    const token = localStorage.getItem('token');
    return `${WS_URL}/notifications/ws?token=${token}`;
};

// Вспомогательная функция для работы с изображениями
export const getImageUrl = (relativePath) => {
    if (!relativePath) return '';
    // Если путь уже полный URL, возвращаем как есть
    if (relativePath.startsWith('http')) return relativePath;
    // Иначе формируем полный путь
    return `${API_URL}${relativePath}`;
};

export default api;
