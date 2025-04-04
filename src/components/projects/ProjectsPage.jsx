import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, message, Card, Spin, Row, Col, Typography, Badge, Tag, Space, Empty } from "antd";
import { PlusOutlined, SearchOutlined, CalendarOutlined, TeamOutlined } from "@ant-design/icons";
import TopMenu from "../layout/TopMenu";
import { getProjects } from "../../services/api";
import "../../styles/ProjectsPage.css";

const { Title, Text } = Typography;

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        getProjects()
            .then((data) => {
                setProjects(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Ошибка загрузки проектов", error);
                message.error("Ошибка загрузки проектов");
                setLoading(false);
            });
    }, []);

    const filteredProjects = projects.filter((project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleProjectClick = (project) => {
        // Сделаем полную копию проекта, чтобы избежать проблем с передачей референса
        const projectToPass = {
            ...project,
            // Убеждаемся, что все поля определены
            id: project.id,
            title: project.title || "",
            description: project.description || "",
            start_date: project.start_date,
            end_date: project.end_date
        };

        // Переходим на /core, передавая выбранный проект через state
        navigate("/core", { 
            state: { 
                selectedProject: projectToPass,
                timestamp: new Date().getTime() // Добавляем timestamp для уникальности state
            } 
        });
    };

    const getStatusColor = (date) => {
        if (!date) return "default";
        const endDate = new Date(date);
        const now = new Date();
        if (endDate < now) return "error";
        const oneWeekLater = new Date();
        oneWeekLater.setDate(now.getDate() + 7);
        if (endDate < oneWeekLater) return "warning";
        return "success";
    };

    if (loading) {
        return (
            <div className="projects-page">
                <TopMenu />
                <div className="projects-content">
                    <div className="projects-loading">
                        <Spin size="large" />
                        <Text>Загрузка проектов...</Text>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="projects-page">
            <TopMenu />
            <div className="projects-content">
                <div className="projects-header">
                    <Title level={2}>Проекты</Title>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        className="create-project-btn"
                        size="large"
                    >
                        Создать проект
                    </Button>
                </div>
                <div className="projects-controls">
                    <Input
                        placeholder="Поиск проектов..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        prefix={<SearchOutlined />}
                        className="projects-search"
                        size="large"
                    />
                </div>
                
                {filteredProjects.length === 0 ? (
                    <Empty 
                        description="Проекты не найдены" 
                        className="projects-empty"
                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    />
                ) : (
                    <Row gutter={[24, 24]} className="projects-grid">
                        {filteredProjects.map((project) => (
                            <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
                                <Card 
                                    className="project-card" 
                                    hoverable
                                    onClick={() => handleProjectClick(project)}
                                >
                                    <div className="project-card-content">
                                        <div className="project-card-header">
                                            <Title level={4} ellipsis={{rows: 1}} className="project-title">
                                                {project.title}
                                            </Title>
                                            <Badge 
                                                status={getStatusColor(project.end_date)} 
                                                text={getStatusColor(project.end_date) === "success" ? "Активный" : 
                                                      getStatusColor(project.end_date) === "warning" ? "Скоро завершение" : 
                                                      "Просрочен"} 
                                            />
                                        </div>
                                        <div className="project-description">
                                            <Text type="secondary" ellipsis={{rows: 2}}>
                                                {project.description || "Нет описания"}
                                            </Text>
                                        </div>
                                        <Space direction="vertical" className="project-meta">
                                            <div className="project-meta-item">
                                                <CalendarOutlined /> 
                                                <Text type="secondary">
                                                    Создан: {new Date(project.start_date).toLocaleDateString()}
                                                </Text>
                                            </div>
                                            {project.end_date && (
                                                <div className="project-meta-item">
                                                    {/* <ClockOutlined />  */}
                                                    <Text type="secondary">
                                                        Срок: {new Date(project.end_date).toLocaleDateString()}
                                                    </Text>
                                                </div>
                                            )}
                                            <div className="project-tags">
                                                <Tag color="blue">
                                                    <TeamOutlined /> {project.user_count || 0} участников
                                                </Tag>
                                            </div>
                                        </Space>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </div>
    );
};

export default ProjectsPage;
