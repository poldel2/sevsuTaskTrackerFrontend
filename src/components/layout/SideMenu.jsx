import React, { useState, useEffect } from "react";
import { Button, Collapse, message } from "antd";
import { PlusOutlined, RightOutlined, LeftOutlined } from "@ant-design/icons";
import "../../styles/sideMenu.css";
import { getProjects } from "../../services/api.js";
import ProjectsModal from "../projects/ProjectsModal";

const { Panel } = Collapse;

const SideMenu = ({ selectedProject, onSelectProject }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (error) {
            message.error("Ошибка при загрузке проектов");
        }
    };

    const handleProjectSuccess = async (newProject) => {
        await fetchProjects();
        onSelectProject(newProject.id);
    };

    return (
        <aside className={`side-menu ${isCollapsed ? "collapsed" : ""}`}>
            <Button
                type="text"
                shape="circle"
                icon={isCollapsed ? <RightOutlined /> : <LeftOutlined />}
                className={`toggle-menu-btn ${isCollapsed ? "collapsed" : ""}`}
                onClick={() => setIsCollapsed(!isCollapsed)}
            />

            {!isCollapsed && (
                <>
                    <div className="side-menu-header">
                        <span className="side-menu-title">Проекты</span>
                        <Button
                            type="text"
                            shape="circle"
                            icon={<PlusOutlined />}
                            className="add-project-btn"
                            onClick={() => setIsModalVisible(true)}
                        />
                    </div>

                    <Collapse defaultActiveKey={["recent"]} ghost expandIconPosition="end">
                        <Panel header="Недавние проекты" key="recent">
                            <div className="project-list">
                                {projects.length > 0 ? (
                                    projects.slice(0, 5).map((project) => (
                                        <div
                                            key={project.id}
                                            className={`project-item ${selectedProject === project.id ? "selected" : ""}`}
                                            onClick={() => onSelectProject(project.id)}
                                        >
                                            {project.title}
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-project">Нет данных</div>
                                )}
                            </div>
                        </Panel>

                        <Panel header="Все проекты" key="all">
                            <div className="project-list">
                                {projects.length > 0 ? (
                                    projects.slice(0, 5).map((project) => (
                                        <div
                                            key={project.id}
                                            className={`project-item ${selectedProject === project.id ? "selected" : ""}`}
                                            onClick={() => onSelectProject(project.id)}
                                        >
                                            {project.title}
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-project">Нет данных</div>
                                )}
                            </div>
                        </Panel>
                    </Collapse>
                </>
            )}
            <div className="side-menu-border" />

            <ProjectsModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSuccess={handleProjectSuccess}
            />
        </aside>
    );
};

export default SideMenu;
