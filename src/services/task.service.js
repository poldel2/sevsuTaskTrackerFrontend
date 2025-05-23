import api from './api';

export const getTaskDetails = async (taskId, projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch task details');
    }
};

export const updateTaskDetails = async (taskId, projectId, data) => {
    try {
        const response = await api.patch(`/projects/${projectId}/tasks/${taskId}`, data);
        return response.data;
    } catch (error) {
        throw new Error('Failed to update task');
    }
};

export const addTimeTracking = async (taskId, projectId, timeData) => {
    try {
        const response = await api.post(`/projects/${projectId}/tasks/${taskId}/time`, timeData);
        return response.data;
    } catch (error) {
        throw new Error('Failed to add time tracking');
    }
};

export const getTaskHistory = async (taskId, projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}/tasks/${taskId}/history`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch task history');
    }
};

export const getRelatedTasks = async (taskId, projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}/tasks/${taskId}/related`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch related tasks');
    }
};

export const getTaskAttachments = async (taskId, projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}/tasks/${taskId}/attachments`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch task attachments');
    }
};
