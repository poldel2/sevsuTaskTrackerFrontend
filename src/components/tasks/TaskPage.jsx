import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTaskDetails, getTaskHistory, getRelatedTasks, getTaskAttachments } from '../../services/task.service';
import { getUserAvatar } from '../../services/api';
import './TaskPage.css';
import TopMenu from '../layout/TopMenu';
import { message } from 'antd';

const TaskPage = () => {
    const { id } = useParams();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [relatedTasks, setRelatedTasks] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [avatar, setAvatar] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadTaskData = async () => {
            try {
                setLoading(true);
                const taskData = await getTaskDetails(id, task?.projectId);
                setTask(taskData);

                // Load additional data in parallel
                const [historyData, relatedData, attachmentsData] = await Promise.all([
                    getTaskHistory(id, taskData.projectId),
                    getRelatedTasks(id, taskData.projectId),
                    getTaskAttachments(id, taskData.projectId)
                ]);

                if (taskData.assigneeId) {
                    const avatarData = await getUserAvatar(taskData.assigneeId);
                    setAvatar(avatarData.url);
                }

                setHistory(historyData);
                setRelatedTasks(relatedData);
                setAttachments(attachmentsData);
            } catch (error) {
                message.error('Failed to load task data');
                console.error('Error loading task:', error);
                navigate('/projects');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadTaskData();
        }
    }, [id, navigate]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!task) {
        return <div className="error">Task not found</div>;
    }

    return (
        <div className="task-page">
            <TopMenu />
            
            <div className="task-header-section">
                <div className="task-header-content">
                    <div className="task-avatar-section">
                        <img 
                            className="assignee-avatar"
                            src={task.assignee?.avatar || '/default-avatar.png'}
                            alt="Assignee avatar"
                        />
                    </div>
                    <div className="task-title-section">
                        <h1 className="task-title">{task.title}</h1>
                        <div className="task-dates">
                            <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                            <span>Updated: {new Date(task.updatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="task-actions">
                        <button className="action-button">Edit</button>
                        <button className="action-button">Add Time</button>
                        <button className="action-button">Track</button>
                    </div>
                </div>
            </div>

            <div className="task-details-section">
                <div className="task-info-grid">
                    <div className="info-item">
                        <label>Status</label>
                        <span className={`status-badge status-${task.status?.toLowerCase()}`}>
                            {task.status}
                        </span>
                    </div>
                    <div className="info-item">
                        <label>Priority</label>
                        <span className={`priority-badge priority-${task.priority?.toLowerCase()}`}>
                            {task.priority}
                        </span>
                    </div>
                    <div className="info-item">
                        <label>Assignee</label>
                        <span>{task.assignee?.name || 'Unassigned'}</span>
                    </div>
                    <div className="info-item">
                        <label>Due Date</label>
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</span>
                    </div>
                </div>

                <div className="task-description-section">
                    <h2>Description</h2>
                    <div className="description-content">
                        {task.description || 'No description provided'}
                    </div>
                </div>

                <div className="task-attachments-section">
                    <h2>Attachments</h2>
                    <div className="attachments-list">
                        {task.attachments?.length > 0 ? (
                            task.attachments.map((file, index) => (
                                <div key={index} className="attachment-item">
                                    <i className="file-icon" />
                                    <span>{file.name}</span>
                                </div>
                            ))
                        ) : (
                            <p>No attachments</p>
                        )}
                    </div>
                </div>

                <div className="related-tasks-section">
                    <h2>Related Tasks</h2>
                    <div className="related-tasks-table">
                        {task.relatedTasks?.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {task.relatedTasks.map((relatedTask) => (
                                        <tr key={relatedTask.id}>
                                            <td>{relatedTask.id}</td>
                                            <td>{relatedTask.title}</td>
                                            <td>{relatedTask.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No related tasks</p>
                        )}
                    </div>
                </div>

                <div className="task-history-section">
                    <h2>History</h2>
                    <div className="history-list">
                        {task.history?.map((event, index) => (
                            <div key={index} className="history-item">
                                <div className="history-date">
                                    {new Date(event.timestamp).toLocaleString()}
                                </div>
                                <div className="history-description">
                                    {event.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskPage;
