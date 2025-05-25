import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Input, Select, Table } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { getImageUrl, getProjectUsers } from '../../services/api';
import { getTaskDetails, updateTaskDetails, getParentTask, getTaskRelations, createTaskRelation, deleteTaskRelation } from '../../services/task.service';
import { getTasks } from '../../services/api';
import '../../styles/TaskPage.css';
import TopMenu from '../layout/TopMenu';

const { TextArea } = Input;

const TaskPage = () => {
    const { projectId, id } = useParams();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState(null);
    const [users, setUsers] = useState([]);
    const [relatedTasks, setRelatedTasks] = useState([]);
    const [parentTask, setParentTask] = useState(null);
    const [allProjectTasks, setAllProjectTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [showAddRow, setShowAddRow] = useState(false);
    const [tempChanges, setTempChanges] = useState({});
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
            const [taskData, projectUsers, relatedTasksData, parentTaskData, projectTasks] = await Promise.all([
                getTaskDetails(taskId, projId),
                getProjectUsers(projId),
                getTaskRelations(projId, taskId),
                getParentTask(projId, taskId),
                getTasks(projId)
            ]);

            setTask(taskData);
            setEditedTask(taskData);
            setUsers(projectUsers);
            setRelatedTasks(relatedTasksData);
            setParentTask(parentTaskData);
            setAllProjectTasks(projectTasks.filter(t => t.id !== taskId));
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
            await updateTaskDetails(id, projectId, tempChanges);
            setTask(prev => ({
                ...prev,
                ...tempChanges
            }));
            setTempChanges({});
            setIsEditing(false);
            message.success('Задача обновлена');
        } catch (error) {
            message.error('Не удалось обновить задачу');
        }
    };

    const handleAddRelation = async () => {
        if (!selectedTaskId) return;
        
        try {
            await createTaskRelation(projectId, task.id, selectedTaskId, "related");
            await loadTaskData();
            setSelectedTaskId(null);
            message.success('Задача связана успешно');
        } catch (error) {
            message.error('Не удалось связать задачи');
        }
    };

    const handleFieldEdit = async (field, value) => {
        if (!isEditing) return;
        
        setTempChanges(prev => ({
            ...prev,
            [field]: value
        }));
        setEditingField(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setTempChanges({});
    };

    const handleDeleteRelation = async (taskId) => {
        try {
            await deleteTaskRelation(projectId, task.id, taskId);
            // После удаления обновляем список связей
            const updatedRelations = await getTaskRelations(projectId, task.id);
            setRelatedTasks(updatedRelations);
            message.success('Связь удалена');
        } catch (error) {
            console.error('Error deleting relation:', error);
            message.error('Не удалось удалить связь');
        }
    };

    const getAssigneeInfo = () => {
        if (!task?.assignee_id || !users.length) return null;
        return users.find(user => user.id === task.assignee_id);
    };

    const getFieldTranslation = (field, value) => {
        if (field === 'status') {
            return statusTranslations[value] || value;
        }
        if (field === 'priority') {
            return priorityTranslations[value] || value;
        }
        return value;
    };

    const renderEditableField = (field, value, options = null) => {
        const displayValue = getFieldTranslation(field, value);
        
        if (editingField === field) {
            if (options) {
                return (
                    <Select
                        autoFocus
                        defaultValue={value}
                        onBlur={() => setEditingField(null)}
                        onSelect={(value) => handleFieldEdit(field, value)}
                        style={{ width: '100%' }}
                    >
                        {options.map(opt => (
                            <Select.Option key={opt.value} value={opt.value}>
                                {opt.label}
                            </Select.Option>
                        ))}
                    </Select>
                );
            }
            return (
                <Input
                    autoFocus
                    defaultValue={value}
                    onBlur={(e) => handleFieldEdit(field, e.target.value)}
                    onPressEnter={(e) => handleFieldEdit(field, e.target.value)}
                />
            );
        }
        return (
            <div 
                className="editable-field"
                onClick={() => isEditing && setEditingField(field)}
            >
                {displayValue}
            </div>
        );
    };

    const relatedTasksColumns = [
        {
            title: 'Название',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <a onClick={() => navigate(`/projects/${projectId}/tasks/${record.id}`)}>
                    {text}
                </a>
            )
        },
        {
            title: 'Исполнитель',
            key: 'assignee',
            render: (_, record) => {
                const assignee = users.find(u => u.id === record.assignee_id);
                return assignee ? `${assignee.first_name} ${assignee.last_name}` : 'Не назначен';
            }
        },
        {
            title: 'Приоритет',
            dataIndex: 'priority',
            key: 'priority',
            render: priority => (
                <span style={{ 
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: priority === 'high' ? '#fff1f0' : 
                                  priority === 'medium' ? '#fff7e6' : '#f0f0f0',
                    color: '#333'
                }}>
                    {priorityTranslations[priority] || priority}
                </span>
            )
        },
        {
            title: 'Срок',
            dataIndex: 'due_date',
            key: 'due_date',
            render: date => date ? new Date(date).toLocaleDateString('ru') : 'Не установлен'
        },
        {
            title: '',
            key: 'actions',
            width: 50,
            render: (_, record) => (
                <div className="related-task-actions">
                    {isEditing && (
                        <Button 
                            type="text" 
                            icon={<DeleteOutlined />} 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRelation(record.id);
                            }}
                            size="small"
                        />
                    )}
                </div>
            )
        }
    ];

    const getFieldValue = (field, originalValue) => {
        return field in tempChanges ? tempChanges[field] : originalValue;
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
                                    <Button onClick={handleCancelEdit}>Отмена</Button>
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
                        {Object.entries({
                            status: { 
                                label: 'Статус',
                                value: getFieldValue('status', task.status),
                                displayValue: getFieldTranslation('status', getFieldValue('status', task.status)),
                                options: Object.entries(statusTranslations).map(([value, label]) => ({
                                    value, label
                                }))
                            },
                            priority: {
                                label: 'Приоритет',
                                value: getFieldValue('priority', task.priority),
                                displayValue: getFieldTranslation('priority', getFieldValue('priority', task.priority)),
                                options: Object.entries(priorityTranslations).map(([value, label]) => ({
                                    value, label
                                }))
                            },
                            'start_date': {
                                label: 'Дата начала',
                                value: task.start_date ? new Date(task.start_date).toLocaleDateString('ru') : 'Не установлена'
                            },
                            'due_date': {
                                label: 'Срок выполнения',
                                value: task.due_date ? new Date(task.due_date).toLocaleDateString('ru') : 'Не установлен'
                            },
                            assignee_id: {
                                label: 'Исполнитель',
                                value: (() => {
                                    const assignee = getAssigneeInfo();
                                    return assignee 
                                        ? `${assignee.first_name} ${assignee.last_name}` 
                                        : 'Не назначен';
                                })(),
                                options: users.map(user => ({
                                    value: user.id,
                                    label: `${user.first_name} ${user.last_name}`
                                }))
                            },
                            grade: {
                                label: 'Сложность',
                                value: task.grade === 'easy' ? 'Легкая' : task.grade === 'medium' ? 'Средняя' : 'Сложная'
                            },
                            parent_id: {
                                label: 'Родительская задача',
                                value: parentTask ? (
                                    <a onClick={() => navigate(`/projects/${projectId}/tasks/${parentTask.id}`)}>
                                        {parentTask.title}
                                    </a>
                                ) : 'Не задана'
                            }
                        }).map(([field, config]) => (
                            <div key={field} className="info-item">
                                <label>{config.label}</label>
                                {renderEditableField(field, config.value, config.options)}
                            </div>
                        ))}
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
                        <Table 
                            columns={relatedTasksColumns}
                            dataSource={relatedTasks}
                            pagination={false}
                            size="small"
                            className="related-tasks-table"
                            footer={isEditing ? () => (
                                showAddRow ? (
                                    <div className="add-relation-row">
                                        <Select
                                            style={{ flex: 1 }}
                                            placeholder="Выберите задачу"
                                            value={selectedTaskId}
                                            onChange={setSelectedTaskId}
                                            options={allProjectTasks.map(task => ({
                                                value: task.id,
                                                label: task.title
                                            }))}
                                            onBlur={() => {
                                                if (!selectedTaskId) {
                                                    setShowAddRow(false);
                                                }
                                            }}
                                        />
                                        <Button 
                                            type="link" 
                                            icon={<PlusOutlined />}
                                            onClick={handleAddRelation}
                                        />
                                    </div>
                                ) : (
                                    <div 
                                        className="add-relation-row"
                                        onClick={() => setShowAddRow(true)}
                                    >
                                        <PlusOutlined /> Добавить связанную задачу
                                    </div>
                                )
                            ) : null}
                        />
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
