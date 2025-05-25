import api from './api';

export const getTaskDetails = async (taskId, projectId) => {
    if (!taskId || !projectId) {
        throw new Error('Task ID and Project ID are required');
    }
    try {
        const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 422) {
            throw new Error('Invalid task or project ID');
        }
        throw error;
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

export const createTaskRelation = async (projectId, taskId, targetTaskId, relationType) => {
    const response = await api.post(
        `/projects/${projectId}/tasks/${taskId}/relations`,
        null,
        { params: { target_task_id: targetTaskId, relation_type: relationType } }
    );
    return response.data;
};

export const deleteTaskRelation = async (projectId, taskId, targetTaskId) => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}/relations/${targetTaskId}`);
};

export const getTaskRelations = async (projectId, taskId, relationType = null) => {
    const response = await api.get(
        `/projects/${projectId}/tasks/${taskId}/relations`,
        { params: { relation_type: relationType } }
    );
    return response.data;
};

export const getParentTask = async (projectId, taskId) => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}/parent`);
    return response.data;
};
