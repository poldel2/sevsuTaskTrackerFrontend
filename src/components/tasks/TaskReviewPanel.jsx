import React, { useState, useEffect } from 'react';
import { 
  getProjectUsers, 
  approveTask, 
  rejectTask, 
  submitForReview, 
  getProjectParticipantsReport, 
  setParticipantManualGrade,
  getCurrentUser
} from '../../services/api';
import { Button, Modal, Input, message, Tag, Table, Select, Tabs, Tooltip, List } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  SendOutlined, 
  FileTextOutlined,
  UserOutlined,
  TrophyOutlined 
} from '@ant-design/icons';
import "../../styles/TaskReviewPanel.css";

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const TaskReviewPanel = ({ tasks, projectId, currentUser: propCurrentUser, onUpdate }) => {
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [currentUser, setCurrentUser] = useState(propCurrentUser || null);
    const [reviewers, setReviewers] = useState([]);
    const [feedback, setFeedback] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null); // 'approve', 'reject', 'report', 'grade'
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [manualGrade, setManualGrade] = useState('A');

    // Выбранная задача
    const task = tasks?.find(t => t.id === selectedTaskId) || tasks?.[0] || null;

    // Получение текущего пользователя, если он не передан в props
    useEffect(() => {
        const fetchCurrentUser = async () => {
            if (!propCurrentUser) {
                try {
                    const userData = await getCurrentUser();
                    setCurrentUser(userData);
                } catch (err) {
                    console.error('Failed to fetch current user:', err);
                    // Если не удалось получить текущего пользователя, используем первого из списка
                    const users = await getProjectUsers(projectId);
                    setCurrentUser(users[0] || null);
                }
            }
        };

        if (!currentUser) {
            fetchCurrentUser();
        }
    }, [propCurrentUser, projectId]);

    // Установка выбранной задачи при изменении списка задач
    useEffect(() => {
        if (tasks && tasks.length > 0 && !selectedTaskId) {
            // По умолчанию выбираем первую задачу со статусом need_review, если такой нет, то первую задачу
            const reviewTask = tasks.find(t => t.status === 'need_review');
            setSelectedTaskId(reviewTask?.id || tasks[0]?.id);
        }
    }, [tasks, selectedTaskId]);

    // Получаем список лидеров и преподавателей проекта
    useEffect(() => {
        const fetchReviewers = async () => {
            try {
                const users = await getProjectUsers(projectId);
                setReviewers(users.filter(u =>
                    u.role === 'ADMIN' || u.role === 'OWNER' || u.role === 'TEACHER'
                ));
            } catch (err) {
                console.error('Failed to fetch reviewers:', err);
                message.error('Не удалось загрузить проверяющих');
            }
        };

        if (projectId) {
            fetchReviewers();
        }
    }, [projectId]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const data = await getProjectParticipantsReport(projectId);
            setReport(data);
        } catch (err) {
            console.error('Failed to fetch report:', err);
            message.error('Не удалось загрузить отчет');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (isTeacherApproval = false) => {
        if (!task) {
            message.error('Задача не выбрана');
            return;
        }
        
        try {
            setLoading(true);
            await approveTask(projectId, task.id, isTeacherApproval, feedback);
            message.success('Задача успешно одобрена');
            onUpdate();
            setModalVisible(false);
        } catch (err) {
            console.error('Approval failed:', err);
            message.error(err.response?.data?.detail || 'Ошибка при подтверждении задачи');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!task) {
            message.error('Задача не выбрана');
            return;
        }
        
        try {
            if (!feedback.trim()) {
                message.warning('Пожалуйста, укажите причину отклонения');
                return;
            }

            setLoading(true);
            await rejectTask(projectId, task.id, feedback);
            message.success('Задача отклонена');
            setModalVisible(false);
            onUpdate();
        } catch (err) {
            console.error('Rejection failed:', err);
            message.error(err.response?.data?.detail || 'Ошибка при отклонении задачи');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitForReview = async () => {
        if (!task) {
            message.error('Задача не выбрана');
            return;
        }
        
        try {
            setLoading(true);
            await submitForReview(projectId, task.id);
            message.success('Задача отправлена на проверку');
            onUpdate();
        } catch (err) {
            console.error('Submit failed:', err);
            message.error(err.response?.data?.detail || 'Ошибка при отправке на проверку');
        } finally {
            setLoading(false);
        }
    };

    const handleSetGrade = async () => {
        try {
            if (!selectedUser) {
                message.warning('Выберите участника');
                return;
            }
            
            setLoading(true);
            await setParticipantManualGrade(projectId, selectedUser, manualGrade);
            message.success('Оценка успешно установлена');
            setModalVisible(false);
            
            // Обновить отчет если он открыт
            if (modalType === 'report') {
                await fetchReport();
            }
        } catch (err) {
            console.error('Setting grade failed:', err);
            message.error(err.response?.data?.detail || 'Не удалось установить оценку');
        } finally {
            setLoading(false);
        }
    };

    // Проверяем права текущего пользователя
    const isAssignee = currentUser && task?.assignee_id === currentUser.id;
    const isLeader = currentUser && (
        currentUser.project_roles?.[projectId] === 'ADMIN' ||
        currentUser.project_roles?.[projectId] === 'OWNER'
    );
    const isTeacher = currentUser?.is_teacher;

    const renderStatusTag = (status) => {
        const statusMap = {
            'todo': { color: 'default', text: 'К выполнению' },
            'in_progress': { color: 'processing', text: 'В работе' },
            'need_review': { color: 'warning', text: 'На проверке' },
            'approved_by_leader': { color: 'success', text: 'Проверено лидером' },
            'approved_by_teacher': { color: 'success', text: 'Проверено преподавателем' },
            'rejected': { color: 'error', text: 'Отклонено' }
        };

        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
    };

    const renderGradeTag = (grade) => {
        if (!grade) return null;
        
        const gradeColor = 
            grade === 'hard' ? 'red' : 
            grade === 'medium' ? 'orange' : 'green';
            
        const gradeText = 
            grade === 'hard' ? 'Сложная' : 
            grade === 'medium' ? 'Средняя' : 'Простая';
            
        return <Tag color={gradeColor}>{gradeText}</Tag>;
    };

    const renderReportModal = () => {
        const columns = [
            {
                title: 'Участник',
                dataIndex: 'user_name',
                key: 'user_name',
            },
            {
                title: 'Легкие задачи',
                dataIndex: 'completed_easy',
                key: 'completed_easy',
            },
            {
                title: 'Средние задачи',
                dataIndex: 'completed_medium',
                key: 'completed_medium',
            },
            {
                title: 'Сложные задачи',
                dataIndex: 'completed_hard',
                key: 'completed_hard',
            },
            {
                title: 'Автооценка',
                dataIndex: 'auto_grade',
                key: 'auto_grade',
                render: grade => grade ? <Tag color="blue">{grade}</Tag> : '-'
            },
            {
                title: 'Ручная оценка',
                dataIndex: 'manual_grade',
                key: 'manual_grade',
                render: grade => grade ? <Tag color="purple">{grade}</Tag> : '-'
            },
            {
                title: 'Действия',
                key: 'actions',
                render: (_, record) => (
                    <Button 
                        icon={<TrophyOutlined />}
                        onClick={() => {
                            setSelectedUser(record.user_id);
                            setModalType('grade');
                            setModalVisible(true);
                        }}
                    >
                        Оценить
                    </Button>
                )
            }
        ];

        return (
            <div>
                <Table 
                    dataSource={report} 
                    columns={columns} 
                    rowKey="user_id"
                    loading={loading}
                />
            </div>
        );
    };

    const renderGradeModal = () => {
        const gradeOptions = ['A', 'B', 'C', 'Fail'];
        
        return (
            <div>
                <p>Выберите оценку для участника:</p>
                <Select 
                    style={{ width: '100%' }}
                    value={manualGrade}
                    onChange={value => setManualGrade(value)}
                >
                    {gradeOptions.map(grade => (
                        <Option key={grade} value={grade}>{grade}</Option>
                    ))}
                </Select>
            </div>
        );
    };

    // Рендер списка задач для выбора
    const renderTasksList = () => {
        return (
            <div className="task-list-container">
                <h3>Задачи проекта</h3>
                <List
                    className="task-list"
                    dataSource={tasks || []}
                    renderItem={item => (
                        <List.Item 
                            className={`task-list-item ${item.id === selectedTaskId ? 'selected' : ''}`}
                            onClick={() => setSelectedTaskId(item.id)}
                        >
                            <div className="task-list-title">{item.title}</div>
                            <div className="task-list-meta">
                                {renderStatusTag(item.status)}
                                {item.assignee_name && <span className="task-assignee">{item.assignee_name}</span>}
                            </div>
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    return (
        <div className="task-review-container">
            {renderTasksList()}
            
            <div className="task-review-panel">
                {task ? (
                    <>
                        <div className="task-meta">
                            <h3>{task.title}</h3>
                            <div className="task-status">
                                Статус: {renderStatusTag(task.status)}
                            </div>
                            <div className="task-grade">
                                Сложность: {renderGradeTag(task.grade)}
                            </div>
                            {task.assignee_name && (
                                <div className="task-assignee">
                                    Исполнитель: <span>{task.assignee_name}</span>
                                </div>
                            )}
                            {task.description && (
                                <div className="task-description">
                                    <p>{task.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Кнопки действий в зависимости от статуса и прав */}
                        <div className="task-actions">
                            {task.status === 'in_progress' && isAssignee && (
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={handleSubmitForReview}
                                    loading={loading}
                                >
                                    Отправить на проверку
                                </Button>
                            )}

                            {task.status === 'need_review' && (
                                <>
                                    {isLeader && task.grade !== 'hard' && (
                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined />}
                                            onClick={() => {
                                                setModalType('approve');
                                                setModalVisible(true);
                                            }}
                                            loading={loading}
                                        >
                                            Подтвердить как лидер
                                        </Button>
                                    )}

                                    {isTeacher && task.grade === 'hard' && (
                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined />}
                                            onClick={() => {
                                                setModalType('approve');
                                                setModalVisible(true);
                                            }}
                                            loading={loading}
                                        >
                                            Подтвердить как преподаватель
                                        </Button>
                                    )}

                                    {(isLeader || isTeacher) && (
                                        <Button
                                            danger
                                            icon={<CloseCircleOutlined />}
                                            onClick={() => {
                                                setModalType('reject');
                                                setModalVisible(true);
                                            }}
                                            loading={loading}
                                        >
                                            Отклонить
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="no-task-selected">
                        <p>Выберите задачу из списка или создайте новую</p>
                    </div>
                )}

                {/* Кнопка отчета доступна для лидеров и преподавателей */}
                {(isLeader || isTeacher) && (
                    <div className="report-button-container">
                        <Tooltip title="Отчет по участникам проекта">
                            <Button
                                icon={<FileTextOutlined />}
                                onClick={() => {
                                    setModalType('report');
                                    fetchReport();
                                    setModalVisible(true);
                                }}
                            >
                                Отчет по участникам
                            </Button>
                        </Tooltip>
                    </div>
                )}
            </div>

            {/* Модальные окна */}
            <Modal
                title={
                    modalType === 'approve' ? 'Подтвердить задачу' :
                    modalType === 'reject' ? 'Отклонить задачу' :
                    modalType === 'report' ? 'Отчет по участникам проекта' :
                    modalType === 'grade' ? 'Установить оценку' : ''
                }
                visible={modalVisible}
                onOk={
                    modalType === 'approve' ? () => handleApprove(task?.grade === 'hard') :
                    modalType === 'reject' ? handleReject :
                    modalType === 'grade' ? handleSetGrade : 
                    () => setModalVisible(false)
                }
                onCancel={() => setModalVisible(false)}
                confirmLoading={loading}
                width={modalType === 'report' ? '80%' : '500px'}
                footer={modalType === 'report' ? null : undefined}
            >
                {modalType === 'approve' && (
                    <div>
                        <p>Вы собираетесь подтвердить выполнение задачи. Добавьте комментарий (необязательно):</p>
                        <TextArea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Комментарий к подтверждению..."
                            rows={4}
                        />
                    </div>
                )}
                
                {modalType === 'reject' && (
                    <div>
                        <p>Укажите причину отклонения:</p>
                        <TextArea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Задача требует доработки..."
                            rows={4}
                        />
                    </div>
                )}
                
                {modalType === 'report' && renderReportModal()}
                
                {modalType === 'grade' && renderGradeModal()}
            </Modal>
        </div>
    );
};

export default TaskReviewPanel;
