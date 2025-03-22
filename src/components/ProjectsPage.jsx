import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, message } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import TopMenu from "./TopMenu";
import { getProjects } from "../services/api";
import "../styles/ProjectsPage.css";
import AddUserButton from "./AddUserButton.jsx";

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        getProjects()
            .then((data) => setProjects(data))
            .catch((error) => {
                console.error("Ошибка загрузки проектов", error);
                message.error("Ошибка загрузки проектов");
            });
    }, []);

    const filteredProjects = projects.filter((project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleProjectClick = (project) => {
        // Переходим на /core, передавая выбранный проект через state
        navigate("/core", { state: { selectedProject: project } });
    };

    return (
        <div className="projects-page">
            <TopMenu />
            <div className="projects-header">
                <h1>Проекты</h1>
                <Button type="primary" icon={<PlusOutlined />} className="create-project-btn">
                    Создать проект
                </Button>
            </div>
            <div className="projects-controls">
                <Input
                    placeholder="Поиск проектов..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    suffix={<SearchOutlined />}
                    className="projects-search"
                />
                <Button type="default" className="filter-project-btn">
                    Фильтр
                </Button>
            </div>
            <div className="projects-table">
                {filteredProjects.map((project) => (
                    <AddUserButton projectId={project.id} />
                ))}


                <table>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Описание</th>
                        <th>Дата создания</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredProjects.map((project) => (
                        <tr key={project.id} onClick={() => handleProjectClick(project)}>
                            <td>{project.id}</td>
                            <td>{project.title}</td>
                            <td>{project.description}</td>
                            <td>{new Date(project.start_date).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectsPage;
