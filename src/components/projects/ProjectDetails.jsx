import React, { useState, useEffect } from 'react';
import { getProject, updateProject } from '../../services/api';
import { Input, Button, message } from 'antd';
import '../../styles/ProjectSettings.css'; // Используем общие стили

const ProjectDetails = ({ projectId }) => {
    const [project, setProject] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        logo: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const data = await getProject(projectId);
            setProject(data);
            setFormData({
                title: data.title || '',
                description: data.description || '',
                logo: data.logo || ''
            });
        } catch (err) {
            setError('Не удалось загрузить данные проекта');
        } finally {
            setLoading(false);
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing) {
            // При отмене редактирования сбрасываем форму до текущих данных проекта
            setFormData({
                title: project.title || '',
                description: project.description || '',
                logo: project.logo || ''
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            setError('Название проекта обязательно');
            return;
        }
        try {
            setLoading(true);
            const updatedProject = await updateProject(projectId, {
                title: formData.title,
                description: formData.description || null,
                logo: formData.logo || null
            });
            setProject(updatedProject);
            setIsEditing(false);
            setError('');
            message.success('Данные проекта успешно обновлены');
        } catch (err) {
            setError('Не удалось сохранить изменения');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !project) {
        return <p>Загрузка...</p>;
    }

    if (error && !project) {
        return <p style={{ color: 'red' }}>{error}</p>;
    }

    return (
        <div className="project-details">
            <h2>Сведения о проекте</h2>
            {project && (
                <div className="details-container">
                    {!isEditing ? (
                        <>
                            <div className="detail-item">
                                <strong>Название:</strong> {project.title}
                            </div>
                            <div className="detail-item">
                                <strong>Описание:</strong> {project.description || 'Не указано'}
                            </div>
                            <div className="detail-item">
                                <strong>Логотип:</strong>
                                {project.logo ? (
                                    <img src={project.logo} alt="Логотип проекта" style={{ maxWidth: '100px', marginTop: '10px' }} />
                                ) : (
                                    'Не задан'
                                )}
                            </div>
                            <Button type="primary" onClick={handleEditToggle} style={{ marginTop: '20px' }}>
                                Редактировать
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="form-item">
                                <label>Название:</label>
                                <Input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Введите название проекта"
                                />
                            </div>
                            <div className="form-item">
                                <label>Описание:</label>
                                <Input.TextArea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Введите описание проекта"
                                    rows={4}
                                />
                            </div>
                            <div className="form-item">
                                <label>Логотип (URL):</label>
                                <Input
                                    name="logo"
                                    value={formData.logo}
                                    onChange={handleInputChange}
                                    placeholder="Введите URL логотипа"
                                />
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <Button
                                    type="primary"
                                    onClick={handleSave}
                                    loading={loading}
                                    style={{ marginRight: '10px' }}
                                >
                                    Сохранить
                                </Button>
                                <Button onClick={handleEditToggle} disabled={loading}>
                                    Отмена
                                </Button>
                            </div>
                            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;