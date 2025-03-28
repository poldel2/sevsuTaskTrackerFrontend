import React, { useState, useEffect, useRef } from "react";
import { Modal, message, Form } from "antd";
import TopMenu from "./components/TopMenu";
import SideMenu from "./components/SideMenu";
import TaskBoard from "./components/TaskBoard";
import TaskForm from "./components/TaskForm";
import "./styles/global.css";
import "./styles/App.css";
import {getProjects, addTask, addProject} from "./services/api";
import { useLocation } from "react-router-dom";

function App() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const location = useLocation();
    const initialLoadCompleted = useRef(false);
    const [isLoading, setIsLoading] = useState(true);

    // Единый эффект для загрузки проектов и обработки выбранного проекта
    useEffect(() => {
        const loadProjectsAndSetSelected = async () => {
            if (initialLoadCompleted.current) return;
            
            setIsLoading(true);
            try {
                const data = await getProjects();
                setProjects(data);
                
                // Если есть проект в location.state, устанавливаем его
                if (location.state?.selectedProject) {
                    setSelectedProject(location.state.selectedProject);
                }
                // Иначе, если есть проекты, устанавливаем первый
                else if (data.length > 0) {
                    setSelectedProject(data[0]);
                }
                
                initialLoadCompleted.current = true;
            } catch (error) {
                message.error("Ошибка загрузки проектов");
            } finally {
                setIsLoading(false);
            }
        };
        
        loadProjectsAndSetSelected();
    }, [location.state]);

    // Отдельный эффект только для изменений в location после начальной загрузки
    useEffect(() => {
        if (initialLoadCompleted.current && location.state?.selectedProject) {
            setSelectedProject(location.state.selectedProject);
        }
    }, [location]);

    const handleAddTask = () => {
        form.validateFields().then((values) => {
            if (!selectedProject) {
                message.error("Выберите проект перед добавлением задачи");
                return;
            }

            const newTask = { ...values, project_id: selectedProject.id };
            addTask(newTask)
                .then(() => {
                    message.success("Задача добавлена");
                    setIsModalVisible(false);
                    form.resetFields();
                })
                .catch(() => message.error("Ошибка при добавлении задачи"));
        });
    };

    return (
        <div className="app-container">
            <TopMenu/>
            <div className="main-content">
                <SideMenu
                    onAddProject={async (newProject) => {
                        try {
                            const createdProject = await addProject(newProject);
                            const updatedProjects = await getProjects();

                            setProjects(updatedProjects);

                            // Находим созданный проект в обновленном списке
                            const newSelectedProject = updatedProjects.find(p => p.id === createdProject.id);

                            if (newSelectedProject) {
                                setSelectedProject(newSelectedProject); // Устанавливаем новый проект, если нашли
                            } else {
                                message.error("Ошибка: созданный проект не найден в обновленном списке");
                            }
                        } catch (error) {
                            message.error("Ошибка при добавлении проекта");
                        }
                    }}
                    projects={projects}
                    selectedProject={selectedProject?.id}
                    onSelectProject={(projectId) => {
                        const project = projects.find((p) => p.id === projectId);
                        setSelectedProject(project || null);
                    }}

                />
                {isLoading ? (
                    <div className="loading-container">Загрузка проектов...</div>
                ) : (
                    <TaskBoard
                        project={selectedProject}
                        onAddTask={handleAddTask}
                    />
                )}
            </div>

        </div>
    );
}

export default App;
