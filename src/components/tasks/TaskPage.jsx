import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTaskDetails, updateTaskDetails } from '../../services/task.service';
import { getImageUrl, getProjectUsers } from '../../services/api';
import '../../styles/TaskPage.css';
import TopMenu from '../layout/TopMenu';
import { Button, message, Input } from 'antd';

const { TextArea } = Input;

const TaskPage = () => {
    const { projectId, id } = useParams();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState(null);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    const statusTranslations = {
        'todo': 'К выполнению',
        'in_progress': 'В работе',
        'need_review': 'На проверке',
        'approved_by_leader': 'Одобрено лидером',
        'approved_by_teacher': 'Одобрено преподавателем',
        'rejected': 'Отклонено'
    };

    const priorityTranslations = {
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий'
    };

    useEffect(() => {
        loadTaskData();
    }, [id, projectId]);

    const loadTaskData = async () => {
        const taskId = parseInt(id);
        const projId = parseInt(projectId);

        if (isNaN(taskId) || isNaN(projId)) {
            message.error('Некорректный ID задачи или проекта');
            navigate('/projects');
            return;
        }

        try {
            setLoading(true);
            const [taskData, projectUsers] = await Promise.all([
                getTaskDetails(taskId, projId),
                getProjectUsers(projId)
            ]);

            if (!taskData) {
                throw new Error('Задача не найдена');
            }

            setTask(taskData);
            setEditedTask(taskData);
            setUsers(projectUsers);
        } catch (error) {
            console.error('Error loading task:', error);
            message.error(error.message || 'Не удалось загрузить задачу');
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await updateTaskDetails(id, projectId, editedTask);
            setTask(editedTask);
            setIsEditing(false);
            message.success('Задача обновлена');
        } catch (error) {
            message.error('Не удалось обновить задачу');
        }
    };

    const getAssigneeInfo = () => {
        if (!task?.assignee_id || !users.length) return null;
        return users.find(user => user.id === task.assignee_id);
    };

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    if (!task) {
        return <div className="error">Задача не найдена</div>;
    }

    return (
        <div className="task-page">
            <div className="top-menu-taskPage">
                <TopMenu />
            </div>

            
            <div className="task-container">
                <div className="task-header-section">
                    <div className="task-header-content">
                        <div className="task-avatar-section">
                            {task?.assignee_id ? (
                                (() => {
                                    const assignee = getAssigneeInfo();
                                    return assignee?.avatar ? (
                                        <img 
                                            className="assignee-avatar"
                                            src={getImageUrl(assignee.avatar)}
                                            alt="Аватар исполнителя"
                                        />
                                    ) : (
                                        <div className="header-default-avatar">
                                            <span>{assignee?.first_name?.[0]?.toUpperCase()}</span>
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="header-default-avatar">
                                    <span>?</span>
                                </div>
                            )}
                        </div>
                        <div className="task-title-section">
                            {isEditing ? (
                                <Input 
                                    value={editedTask.title}
                                    onChange={e => setEditedTask({...editedTask, title: e.target.value})}
                                />
                            ) : (
                                <h1 className="task-title2">{task.title}</h1>
                            )}
                            <div className="task-dates">
                                <span>Создано: {new Date(task.created_at).toLocaleString('ru')}</span>
                                <span>Обновлено: {new Date(task.updated_at).toLocaleString('ru')}</span>
                            </div>
                        </div>
                        <div className="task-actions2">
                            {isEditing ? (
                                <>
                                    <Button type="primary" onClick={handleSave}>Сохранить</Button>
                                    <Button onClick={() => setIsEditing(false)}>Отмена</Button>
                                </>
                            ) : (
                                <>
                                    <Button className="edit-button" onClick={() => setIsEditing(true)}>Редактировать</Button>
                                    <Button>Добавить время</Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="task-details-section">
                    <div className="task-info-grid">
                        <div className="info-item">
                            <label>Статус</label>
                            <span className={`status-badge status-${task.status}`}>
                                {statusTranslations[task.status] || task.status}
                            </span>
                        </div>
                        <div className="info-item">
                            <label>Приоритет</label>
                            <span className={`priority-badge priority-${task.priority}`}>
                                {priorityTranslations[task.priority] || task.priority}
                            </span>
                        </div>
                        <div className="info-item">
                            <label>Дата начала</label>
                            <span>{task.start_date ? new Date(task.start_date).toLocaleDateString('ru') : 'Не установлена'}</span>
                        </div>
                        <div className="info-item">
                            <label>Срок выполнения</label>
                            <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('ru') : 'Не установлен'}</span>
                        </div>
                        <div className="info-item">
                            <label>Исполнитель</label>
                            <span>
                                {(() => {
                                    const assignee = getAssigneeInfo();
                                    return assignee 
                                        ? `${assignee.first_name} ${assignee.last_name}` 
                                        : 'Не назначен';
                                })()}
                            </span>
                        </div>
                        <div className="info-item">
                            <label>Сложность</label>
                            <span>{task.grade === 'easy' ? 'Легкая' : task.grade === 'medium' ? 'Средняя' : 'Сложная'}</span>
                        </div>
                    </div>

                    <div className="task-description-section">
                        <h2 className="section-title">Описание</h2>
                        {isEditing ? (
                            <TextArea 
                                value={editedTask.description}
                                onChange={e => setEditedTask({...editedTask, description: e.target.value})}
                                rows={4}
                            />
                        ) : (
                            <div className="description-content">
                                {task.description || 'Описание отсутствует'}
                            </div>
                        )}
                    </div>

                    <div className="related-tasks-section">
                        <h2 className="section-title">Связанные задачи</h2>
                        <div className="related-tasks-table">
                            {task.related_tasks?.length > 0 ? (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Название</th>
                                            <th>Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {task.related_tasks.map((relatedTask) => (
                                            <tr key={relatedTask.id} onClick={() => navigate(`/projects/${projectId}/tasks/${relatedTask.id}`)}>
                                                <td>{relatedTask.id}</td>
                                                <td>{relatedTask.title}</td>
                                                <td>{statusTranslations[relatedTask.status]}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>Нет связанных задач</p>
                            )}
                        </div>
                    </div>

                    <div className="task-comments-section">
                        <h2 className="section-title">Комментарии</h2>
                        <div className="comments-list">
                            <p>Комментарии пока недоступны</p>
                        </div>
                        <div className="comment-input">
                            <TextArea placeholder="Добавьте комментарий..." />
                            <Button type="primary">Отправить</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskPage;
