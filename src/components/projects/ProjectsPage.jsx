import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, message, Typography, Spin, Empty } from "antd";
import { PlusOutlined, SearchOutlined, TeamOutlined, RightOutlined, ArrowRightOutlined } from "@ant-design/icons";
import TopMenu from "../layout/TopMenu";
import { getProjects, getProjectUsers } from "../../services/api";
import ProjectsModal from "./ProjectsModal";
import "../../styles/ProjectsPage.css";

const { Title } = Typography;

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [projectMembers, setProjectMembers] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [expandedProjectId, setExpandedProjectId] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const navigate = useNavigate();

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

    const handleProjectSuccess = async (newProject) => {
        await loadProjects();
        handleProjectNavigate(newProject);
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

            <ProjectsModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSuccess={handleProjectSuccess}
            />
        </div>
    );
};

export default ProjectsPage;
