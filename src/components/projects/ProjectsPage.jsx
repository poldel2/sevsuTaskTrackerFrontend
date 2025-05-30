import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, message, Typography, Spin, Empty, Modal, Form, Space } from "antd";
import { PlusOutlined, SearchOutlined, TeamOutlined, RightOutlined, ArrowRightOutlined, EditOutlined } from "@ant-design/icons";
import TopMenu from "../layout/TopMenu";
import { getProjects, getProjectUsers, addProject, uploadProjectLogo } from "../../services/api";
import ImageCropper from '../common/ImageCropper';
import "../../styles/ProjectsPage.css";

const { Title } = Typography;

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [projectMembers, setProjectMembers] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [expandedProjectId, setExpandedProjectId] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [cropFile, setCropFile] = useState(null);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const projectsData = await getProjects();
            setProjects(projectsData);

            // Загружаем количество участников для каждого проекта
            const membersPromises = projectsData.map(project => 
                getProjectUsers(project.id)
                    .then(users => ({ [project.id]: users.length }))
                    .catch(() => ({ [project.id]: 0 }))
            );

            const membersResults = await Promise.all(membersPromises);
            const membersData = Object.assign({}, ...membersResults);
            setProjectMembers(membersData);
        } catch (error) {
            message.error("Ошибка загрузки проектов");
        } finally {
            setLoading(false);
        }
    };

    const handleProjectClick = (projectId) => {
        if (expandedProjectId === projectId) {
            setExpandedProjectId(null);
        } else {
            setExpandedProjectId(projectId);
        }
    };

    const handleProjectNavigate = (project) => {
        navigate("/core", { 
            state: { 
                selectedProject: project,
                timestamp: new Date().getTime()
            } 
        });
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCropFile(file);
    };

    const handleCropComplete = async (croppedBlob, projectId) => {
        try {
            const file = new File([croppedBlob], 'logo.jpg', { type: 'image/jpeg' });
            await uploadProjectLogo(projectId, file);
            message.success('Логотип проекта успешно добавлен');
        } catch (error) {
            message.error('Не удалось загрузить логотип');
        } finally {
            setCropFile(null);
        }
    };

    const handleAddProject = async () => {
        try {
            const values = await form.validateFields();
            const newProject = {
                title: values.name,
                description: values.description,
                start_date: new Date().toISOString(),
                end_date: new Date().toISOString(),
            };
            
            const addedProject = await addProject(newProject);
            
            // Сначала добавляем логотип, если он есть
            if (cropFile) {
                const file = new File([cropFile], 'logo.jpg', { type: 'image/jpeg' });
                await uploadProjectLogo(addedProject.id, file);
            }

            message.success("Проект добавлен");
            setIsModalVisible(false);
            form.resetFields();
            setCropFile(null);
            await loadProjects();
            handleProjectNavigate(addedProject);
        } catch (error) {
            console.error(error);
            message.error("Ошибка при добавлении проекта");
        }
    };

    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="projects-page-v2">
                <TopMenu />
                <div className="projects-content-v2">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                        <Spin size="large" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="projects-page-v2">
            <TopMenu />
            <div className="projects-content-v2">
                <div className="projects-header-v2">
                    <Title className="projects-title-v2" level={2}>Проекты</Title>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        className="create-project-btn-v2"
                        onClick={() => setIsModalVisible(true)}
                    >
                        Создать проект
                    </Button>
                </div>
                
                <div className="projects-controls-v2">
                    <Input
                        placeholder="Поиск проектов..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        prefix={<SearchOutlined />}
                        className="projects-search-v2"
                    />
                </div>

                {filteredProjects.length === 0 ? (
                    <Empty description="Проекты не найдены" />
                ) : (
                    <div className="project-list-v2">
                        {filteredProjects.map((project) => (
                            <div key={project.id} className="project-item-v2">
                                <div 
                                    className="project-header-v2"
                                    onClick={() => handleProjectClick(project.id)}
                                >
                                    <div className="project-main-info-v2">
                                        <h3 className="project-title-v2">{project.title}</h3>
                                        <div className="project-members-v2">
                                            <TeamOutlined />
                                            <span>{projectMembers[project.id] || 0} участников</span>
                                        </div>
                                    </div>
                                    <RightOutlined 
                                        className={`project-arrow-v2 ${expandedProjectId === project.id ? 'expanded' : ''}`}
                                    />
                                </div>
                                {expandedProjectId === project.id && (
                                    <div className="project-description-v2">
                                        <p>{project.description || "Описание отсутствует"}</p>
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'flex-end',
                                            marginTop: '10px'
                                        }}>
                                            <Button 
                                                type="primary"
                                                icon={<ArrowRightOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleProjectNavigate(project);
                                                }}
                                            >
                                                Перейти в проект
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                title="Создать проект"
                open={isModalVisible}
                onOk={handleAddProject}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                    setCropFile(null);
                }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Название проекта"
                        name="name"
                        rules={[{ required: true, message: "Введите название проекта" }]}
                    >
                        <Input placeholder="Введите название" />
                    </Form.Item>
                    <Form.Item
                        label="Описание"
                        name="description"
                        rules={[{ required: true, message: "Введите описание проекта" }]}
                    >
                        <Input.TextArea placeholder="Введите описание" rows={4} />
                    </Form.Item>
                    <Form.Item label="Логотип проекта">
                        <Button icon={<EditOutlined />} onClick={() => document.getElementById('project-logo-upload').click()}>
                            Выбрать логотип
                        </Button>
                        <input
                            id="project-logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            style={{ display: 'none' }}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {cropFile && (
                <ImageCropper
                    file={cropFile}
                    aspect={1}
                    targetWidth={150}
                    targetHeight={150}
                    title="Логотип проекта"
                    imageLabel="логотипа проекта"
                    onCropComplete={(blob) => {
                        setCropFile(blob);
                    }}
                    onCancel={() => setCropFile(null)}
                />
            )}
        </div>
    );
};

export default ProjectsPage;
