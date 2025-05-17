import React, { useState, useEffect } from 'react';
import { getProject, updateProject, uploadProjectLogo, getImageUrl } from '../../services/api';
import { Input, Button, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import ImageCropper from '../common/ImageCropper';
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
    const [cropFile, setCropFile] = useState(null);

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

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCropFile(file);
    };

    const handleCropComplete = async (croppedBlob) => {
        try {
            setLoading(true);
            const file = new File([croppedBlob], 'logo.jpg', { type: 'image/jpeg' });
            const updatedProject = await uploadProjectLogo(projectId, file);
            setProject(updatedProject);
            setFormData(prev => ({
                ...prev,
                logo: updatedProject.logo
            }));
            message.success('Логотип проекта успешно обновлен');
        } catch (err) {
            setError('Не удалось загрузить логотип');
        } finally {
            setLoading(false);
            setCropFile(null);
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
            <h2>Сведения о проекта</h2>
            {project && (
                <>
                    <div className="project-header">
                        <div className="project-logo-section">
                            <div className="project-logo-container">
                                {formData.logo ? (
                                    <img src={getImageUrl(formData.logo)} alt="Логотип проекта" className="project-settings-logo" />
                                ) : (
                                    <div className="default-project-logo">
                                        <span className="logo-letter">{formData.title?.[0]?.toUpperCase() || "?"}</span>
                                    </div>
                                )}
                                <label className="logo-upload-button" htmlFor="logo-upload">
                                    <EditOutlined />
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="project-title-section">
                            <Input
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Название проекта"
                                className="project-title-input"
                            />
                            <div className="project-title-underline" />
                        </div>
                    </div>

                    <div className="project-info-section">
                        <div className="project-info-field">
                            <div className="field-label">URL логотипа</div>
                            <Input
                                name="logo"
                                placeholder="URL логотипа"
                                value={formData.logo}
                                onChange={handleInputChange}
                            />
                        </div>
                        
                        <div className="project-info-field">
                            <div className="field-label">Описание</div>
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
                                className="save-button"
                            >
                                Сохранить изменения
                            </Button>
                            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                        </div>
                    </div>
                    {cropFile && (
                        <ImageCropper
                            file={cropFile}
                            aspect={1}
                            onCropComplete={handleCropComplete}
                            onCancel={() => setCropFile(null)}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default ProjectDetails;