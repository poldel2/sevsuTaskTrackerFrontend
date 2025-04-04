import React, { useState, useEffect } from "react";
import { Button, Collapse, Modal, Form, Input, message } from "antd";
import { PlusOutlined, RightOutlined, LeftOutlined, MenuOutlined, ProjectOutlined, PlusCircleOutlined, HomeOutlined, CaretRightOutlined } from "@ant-design/icons";
import "../../styles/sideMenu.css";
import { addProject, getProjects } from "../../services/api.js";
import { Link, useNavigate, useLocation } from 'react-router-dom';

const { Panel } = Collapse;

const SideMenu = ({ selectedProject, onSelectProject }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
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

    const handleAddProject = () => {
        form.validateFields()
            .then(async (values) => {
                const newProject = {
                    title: values.name,
                    description: values.description,
                    start_date: new Date().toISOString(),
                    end_date: new Date().toISOString(),

                };
                const addedProject = await addProject(newProject); // Получаем новый проект с ID
                message.success("Проект добавлен");
                fetchProjects();
                setIsModalVisible(false);
                form.resetFields();
                fetchProjects().then(() => {
                    onSelectProject(addedProject.id); // Устанавливаем новый проект как выбранный
                });
            })
            .catch(() => message.error("Ошибка при добавлении проекта"));
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
                                    projects.map((project) => (
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

            {/* Модальное окно добавления проекта */}
            <Modal
                title="Добавить проект"
                open={isModalVisible}
                onOk={handleAddProject}
                onCancel={() => setIsModalVisible(false)}
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
                </Form>
            </Modal>
        </aside>
    );
};

export default SideMenu;
