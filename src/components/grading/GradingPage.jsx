import React, { useState, useEffect } from 'react';
import { Typography, Select, Table, Modal, Spin, Empty, Alert, Button, InputNumber, Card } from 'antd';
import { SettingOutlined, RightOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import TopMenu from '../layout/TopMenu';
import { searchUsers, getUserProjectsForGrading, getProjectTaskStatistics, updateGradingSettings, updateTaskGrade } from '../../services/api';
import { GRADING_TEMPLATES } from '../../config/gradingTemplates';
import '../../styles/GradingPage.css';

const { Title } = Typography;

const GradingPage = () => {
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userProjects, setUserProjects] = useState([]);
    const [taskStats, setTaskStats] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [users, setUsers] = useState([]);
    const [expandedProjects, setExpandedProjects] = useState([]);
    const [projectStats, setProjectStats] = useState({});
    const [customSettings, setCustomSettings] = useState({
        required_easy_tasks: 0,
        required_medium_tasks: 0,
        required_hard_tasks: 0
    });
    const [totalScore, setTotalScore] = useState(0);
    const [selectedUserInfo, setSelectedUserInfo] = useState(null);
    const navigate = useNavigate();

    const loadUsers = async (searchText) => {
        if (searchText.length < 2) return;
        try {
            const data = await searchUsers(searchText);
            setUsers(data);
        } catch (error) {
            console.error('Ошибка при поиске пользователей:', error);
        }
    };

    const calculateTotalScore = (tasks) => {
        if (!tasks) return 0;
        return tasks.reduce((sum, task) => sum + (task.score || 0), 0);
    };

    const loadUserProjects = async (userId) => {
        try {
            setLoading(true);
            const projects = await getUserProjectsForGrading(userId);
            const userInfo = users.find(u => u.id === userId);
            setSelectedUserInfo(userInfo);
            
            // Загружаем статистику для всех проектов сразу
            const projectsWithStats = await Promise.all(
                projects.map(async (project) => {
                    const stats = await getProjectTaskStatistics(project.id, userId);
                    return { ...project, stats };
                })
            );
            
            let totalUserScore = 0;
            projectsWithStats.forEach(project => {
                if (project.stats?.tasks) {
                    totalUserScore += project.stats.tasks.reduce((sum, task) => 
                        sum + (task.score || 0), 0);
                }
            });
            
            // Ограничиваем максимальный балл до 100
            totalUserScore = Math.min(totalUserScore, 100);
            
            setUserProjects(projectsWithStats);
            setTotalScore(totalUserScore);
        } catch (error) {
            console.error('Ошибка при загрузке проектов:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = async (userId) => {
        setSelectedUser(userId);
        await loadUserProjects(userId);
    };

    const handleExpandProject = async (projectId) => {
        if (!expandedProjects.includes(projectId)) {
            try {
                const stats = await getProjectTaskStatistics(projectId, selectedUser);
                setProjectStats(prev => ({
                    ...prev,
                    [projectId]: { ...stats }
                }));
                setExpandedProjects(prev => [...prev, projectId]);
            } catch (error) {
                console.error('Ошибка при загрузке статистики:', error);
            }
        } else {
            setExpandedProjects(prev => prev.filter(id => id !== projectId));
        }
    };

    const handleProjectSettings = async (e, project) => {
        e.stopPropagation();
        setSelectedProject(project);
        setCustomSettings({
            required_easy_tasks: project.settings?.required_easy_tasks || 0,
            required_medium_tasks: project.settings?.required_medium_tasks || 0,
            required_hard_tasks: project.settings?.required_hard_tasks || 0
        });
        setModalVisible(true);
    };

    const handleTemplateSelect = (template) => {
        const selectedTemplate = GRADING_TEMPLATES[template];
        setCustomSettings(selectedTemplate);
    };

    const handleSaveSettings = async () => {
        try {
            await updateGradingSettings(selectedProject.id, customSettings);
            setProjectStats(prev => ({
                ...prev,
                [selectedProject.id]: {
                    ...prev[selectedProject.id],
                    settings: customSettings
                }
            }));
            setModalVisible(false);
        } catch (error) {
            console.error('Ошибка при сохранении настроек:', error);
        }
    };

    const handleTaskGrade = async (taskId, status) => { 
        try {
            await updateTaskGrade(taskId, { completion_status: status });
            // Обновляем статистику проекта
            const updatedProjects = await Promise.all(
                userProjects.map(async project => {
                    if (project.stats.tasks.some(t => t.id === taskId)) {
                        const stats = await getProjectTaskStatistics(st.id, selectedUser);
                        return { ...project, stats };
                    }
                    return project;
                })
            );
            setUserProjects(updatedProjects);
            
            // Обновляем общий балл
            let newTotalScore = 0;
            updatedProjects.forEach(project => {
                if (project.stats?.tasks) {
                    newTotalScore += project.stats.tasks.reduce((sum, task) => 
                        sum + (task.score || 0), 0);
                }
            });
            setTotalScore(Math.min(newTotalScore, 100));
        } catch (error) {
            console.error('Ошибка при обновлении оценки:', error);
        }
    };

    const getScoreColor = (score) => {
        if (score <= 60) return '#ff4d4f';
        if (score <= 74) return '#faad14';
        if (score <= 89) return '#52c41a';
        return '#237804';
    };

    // Колонки для таблицы задач внутри проекта
    const taskColumns = [
        {
            title: 'Название',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <a onClick={() => navigate(`/projects/${record.project_id}/tasks/${record.id}`)}>
                    {text}
                </a>
            )
        },
        {
            title: 'Сложность',
            dataIndex: 'grade',
            key: 'grade',
            render: grade => ({
                easy: 'Легкая',
                medium: 'Средняя',
                hard: 'Сложная'
            }[grade] || grade)
        },
        {
            title: 'Статус выполнения',
            key: 'completion',
            dataIndex: 'completion_status',
            render: (status, record) => (
                <Select
                    value={status || 'not_completed'}
                    onChange={(value) => handleTaskGrade(record.id, value)}
                    options={[
                        { value: 'completed', label: 'Выполнено' },
                        { value: 'partial', label: 'Частично выполнено' },
                        { value: 'not_completed', label: 'Не выполнено' }
                    ]}
                />
            )
        }
    ];

    const columns = [
        {
            title: 'Название проекта',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div className="project-info-grading">
                    <span className="project-title-grading">{text}</span>
                </div>
            )
        },
        {
            title: 'Роль в проекте',
            dataIndex: 'role',
            key: 'role',
            width: 200
        },
        {
            title: 'Настройки оценки',
            key: 'settings',
            width: 100,
            render: (_, record) => (
                <SettingOutlined 
                    className="project-settings-grading"
                    onClick={() => handleProjectSettings(record)}
                />
            )
        }
    ];

    return (
        <div className="grading-page">
            <TopMenu />
            <div className="grading-content">
                <div className="grading-header">
                    <Title level={2} className="grading-title">Оценка пользователя</Title>
                </div>

                <div className="user-section">
                    <div className="user-select-container">
                        <Select
                            showSearch
                            placeholder="Выберите пользователя"
                            defaultActiveFirstOption={false}
                            showArrow={false}
                            filterOption={false}
                            onSearch={loadUsers}
                            onChange={handleUserSelect}
                            notFoundContent={null}
                            style={{ width: '300px' }}
                            options={(users || []).map(user => ({
                                value: user.id,
                                label: `${user.last_name} ${user.first_name}`
                            }))}
                        />
                    </div>
                    
                    {selectedUserInfo && (
                        <Card className="user-info-card" style={{ marginLeft: 'auto' }}>
                            <div className="user-info">
                                <UserOutlined className="user-icon" />
                                <div className="user-details">
                                    <h3>{selectedUserInfo.last_name} {selectedUserInfo.first_name}</h3>
                                    <p>Группа: {selectedUserInfo.group || 'Не указана'}</p>
                                </div>
                                <div className="total-score-badge" style={{ color: getScoreColor(totalScore) }}>
                                    Общий балл: {totalScore}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Spin size="large" />
                    </div>
                ) : selectedUser ? (
                    userProjects.length > 0 ? (
                        <div className="projects-list-grading">
                            {userProjects.map(project => (
                                <div key={project.id} className="project-item-grading">
                                    <div 
                                        className="project-header-grading"
                                        onClick={() => handleExpandProject(project.id)}
                                    >
                                        <div className="project-info-grading">
                                            <RightOutlined 
                                                className={`project-arrow-grading ${expandedProjects.includes(project.id) ? 'expanded' : ''}`}
                                            />
                                            <span className="project-title-grading">{project.title}</span>
                                            {project.stats && (
                                                <span className={`norm-status ${
                                                    project.stats.easy_completed >= (project.stats.settings?.required_easy_tasks || 0) &&
                                                    project.stats.medium_completed >= (project.stats.settings?.required_medium_tasks || 0) &&
                                                    project.stats.hard_completed >= (project.stats.settings?.required_hard_tasks || 0)
                                                        ? 'completed'
                                                        : 'not-completed'
                                                }`}>
                                                    {project.stats.easy_completed >= (project.stats.settings?.required_easy_tasks || 0) &&
                                                     project.stats.medium_completed >= (project.stats.settings?.required_medium_tasks || 0) &&
                                                     project.stats.hard_completed >= (project.stats.settings?.required_hard_tasks || 0)
                                                        ? 'Норма выполнена'
                                                        : 'Норма не выполнена'}
                                                </span>
                                            )}
                                        </div>
                                        <SettingOutlined 
                                            className="project-settings-grading"
                                            onClick={(e) => handleProjectSettings(e, project)}
                                        />
                                    </div>
                                    
                                    {expandedProjects.includes(project.id) && projectStats[project.id] && (
                                        <div className="project-content-grading">
                                            <div className="task-stats-summary">
                                                <div>Легкие задачи: {projectStats[project.id].easy_completed} из {projectStats[project.id].settings?.required_easy_tasks}</div>
                                                <div>Средние задачи: {projectStats[project.id].medium_completed} из {projectStats[project.id].settings?.required_medium_tasks}</div>
                                                <div>Сложные задачи: {projectStats[project.id].hard_completed} из {projectStats[project.id].settings?.required_hard_tasks}</div>
                                            </div>
                                            
                                            <Table
                                                columns={taskColumns}
                                                dataSource={projectStats[project.id].tasks}
                                                pagination={false}
                                                rowKey="id"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty description="Нет проектов для оценки" />
                    )
                ) : (
                    <Empty description="Выберите пользователя для оценки" />
                )}

                <Modal
                    title="Настройка норм оценок"
                    visible={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setModalVisible(false)}>
                            Отмена
                        </Button>,
                        <Button 
                            key="submit" 
                            type="primary" 
                            onClick={handleSaveSettings}
                            style={{ backgroundColor: '#5C7BBB', borderColor: '#5C7BBB' }}
                        >
                            Сохранить
                        </Button>
                    ]}
                    className="grading-settings-modal"
                >
                    <div className="templates-select">
                        <Select
                            style={{ width: '100%', marginBottom: '20px' }}
                            placeholder="Выберите шаблон оценок"
                            onChange={handleTemplateSelect}
                            options={Object.entries(GRADING_TEMPLATES).map(([key, template]) => ({
                                value: key,
                                label: template.name
                            }))}
                        />
                        
                        <div className="custom-settings">
                            <h4>Настройка требований:</h4>
                            <div className="settings-inputs">
                                <div className="setting-item">
                                    <label>Легкие задачи:</label>
                                    <InputNumber
                                        min={0}
                                        value={customSettings.required_easy_tasks}
                                        onChange={value => setCustomSettings(prev => ({ ...prev, required_easy_tasks: value }))}
                                    />
                                </div>
                                <div className="setting-item">
                                    <label>Средние задачи:</label>
                                    <InputNumber
                                        min={0}
                                        value={customSettings.required_medium_tasks}
                                        onChange={value => setCustomSettings(prev => ({ ...prev, required_medium_tasks: value }))}
                                    />
                                </div>
                                <div className="setting-item">
                                    <label>Сложные задачи:</label>
                                    <InputNumber
                                        min={0}
                                        value={customSettings.required_hard_tasks}
                                        onChange={value => setCustomSettings(prev => ({ ...prev, required_hard_tasks: value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default GradingPage;