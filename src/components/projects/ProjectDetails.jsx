import React, { useState, useEffect } from 'react';
import { getProject, updateProject } from '../../services/api';
import { Input, Button, message } from 'antd';
import '../../styles/ProjectSettings.css';

const ProjectDetails = ({ projectId }) => {
    const [project, setProject] = useState(null);
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
            const updatedProject = await updateProject(projectId, formData);
            setProject(updatedProject);
            setError('');
            message.success('Данные проекта успешно обновлены');
        } catch (err) {
            setError('Не удалось сохранить изменения');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !project) {
        return <div className="project-details"><p>Загрузка...</p></div>;
    }

    if (error && !project) {
        return <div className="project-details"><p style={{ color: 'red' }}>{error}</p></div>;
    }

    return (
        <div className="project-details">
            <h2>Сведения о проекте</h2>
            {project && (
                <>
                    <div className="project-logo-section">
                        {formData.logo ? (
                            <div className="project-logo-container">
                                <img src={formData.logo} alt="Логотип проекта" className="project-logo" />
                            </div>
                        ) : (
                            <div className="project-logo-container">
                                <div className="default-project-logo">
                                    <span className="logo-letter">{formData.title?.[0]?.toUpperCase() || "?"}</span>
                                </div>
                            </div>
                        )}
                        <Input
                            name="logo"
                            placeholder="URL логотипа"
                            value={formData.logo}
                            onChange={handleInputChange}
                            style={{ width: '300px' }}
                        />
                    </div>

                    <div className="project-info-section">
                        <div className="project-info-field">
                            <Input
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Название проекта"
                                style={{ borderBottom: '1px solid #d9d9d9', fontSize: '18px' }}
                            />
                        </div>
                        
                        <div className="project-info-field">
                            <Input.TextArea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Описание проекта"
                                rows={4}
                            />
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <Button
                                type="primary"
                                onClick={handleSave}
                                loading={loading}
                            >
                                Сохранить изменения
                            </Button>
                            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProjectDetails;