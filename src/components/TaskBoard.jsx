import React, { useState, useEffect } from "react";
import "../styles/TaskBoard.css";
import TaskViewSidebar from "./TaskViewSidebar";
import { Modal, Input, Select, DatePicker, message } from "antd";
import {
    PlusOutlined,
    FilterOutlined,
    MoreOutlined,
    SettingOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { getTasks, addTask, updateTask, getColumns, updateColumn, getProjectUsers } from "../services/api";
import {
    DndContext,
    closestCorners,
    DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskColumn } from "./TaskColumn";
import TaskItem from "./TaskItem.jsx";
import Chat from "./Chat";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const TaskBoard = ({ project }) => {
    const projectData = project?.id ? project : { id: "test", name: "Проект", logo: "" };
    const [tasks, setTasks] = useState([]);
    const [columns, setColumns] = useState([]);
    const [activeView, setActiveView] = useState("Задачи");
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [draggingOver, setDraggingOver] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (projectData.id !== "test") {
            fetchData();
        } else {
            setTasks([]);
            setColumns([]);
            setUsers([]);
        }
    }, [projectData.id]);

    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        priority: "medium",
        assignee_id: null,
        column_id: null,
        due_date: null,
    });

    const fetchData = async () => {
        try {
            const [tasksData, columnsData, usersData] = await Promise.all([
                getTasks(projectData.id),
                getColumns(projectData.id),
                getProjectUsers(projectData.id),
            ]);
            const enrichedTasks = tasksData.map(task => {
                const assignee = usersData.find(user => user.first_name === task.assignee_name);
                console.log("qweqwe" + task.assignee_name);
                return {
                    ...task,
                    assignee_name: assignee ? `${assignee.first_name} ${assignee.last_name}` : null,
                };
            });
            setTasks(enrichedTasks);
            setColumns(columnsData.sort((a, b) => a.position - b.position));
            setUsers(usersData);
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
            setTasks([]);
            setColumns([]);
            setUsers([]);
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title.trim()) {
            message.error('Название задачи обязательно');
            return;
        }
        try {
            const taskData = {
                ...newTask,
                column_id: newTask.column_id || columns[0]?.id,
                due_date: newTask.due_date ? newTask.due_date.format('YYYY-MM-DD') : null,
            };
            const createdTask = await addTask(taskData, projectData.id);
            const assignee = users.find(user => user.id === createdTask.assignee_id);
            const enrichedTask = {
                ...createdTask,
                assignee_name: assignee ? `${assignee.first_name} ${assignee.last_name}` : null,
            };
            setTasks([...tasks, enrichedTask]);
            setIsModalVisible(false);
            setNewTask({
                title: "",
                description: "",
                priority: "medium",
                assignee_id: null,
                column_id: null,
                due_date: null,
            });
            message.success('Задача успешно создана');
        } catch (error) {
            console.error("Ошибка при добавлении задачи:", error);
            message.error('Не удалось создать задачу');
        }
    };

    const filteredTasks = tasks.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDragStart = (event) => {
        const { active } = event;
        if (active.data.current.type === 'task') {
            setActiveTask(tasks.find((task) => task.id === active.id));
            setActiveTaskId(active.id);
        }
    };

    const handleDragOver = (event) => {
        const { over } = event;
        setDraggingOver(over ? over.id : null);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const isActiveColumn = columns.some(col => col.id === activeId);
        const isOverColumn = columns.some(col => col.id === overId);

        if (isActiveColumn && isOverColumn && activeId !== overId) {
            const activeColumn = columns.find(col => col.id === activeId);
            const overColumn = columns.find(col => col.id === overId);

            const columnData = {
                name: activeColumn.name,
                position: overColumn.position,
                color: activeColumn.color,
            };

            try {
                await updateColumn(projectData.id, activeId, columnData);
                await fetchData();
            } catch (err) {
                console.error('Ошибка обновления столбца:', err);
                await fetchData();
            }
        }

        if (!isActiveColumn) {
            const taskId = activeId;
            let newColumnId;

            if (isOverColumn) {
                newColumnId = overId;
            } else {
                const overTask = tasks.find(t => t.id === overId);
                newColumnId = overTask ? overTask.column_id : null;
            }

            const activeTask = tasks.find(t => t.id === taskId);
            if (newColumnId && newColumnId !== activeTask.column_id) {
                try {
                    const updatedTask = await updateTask(taskId, projectData.id, {
                        column_id: newColumnId,
                        title: activeTask.title,
                    });
                    // Добавляем assignee_name к обновлённой задаче
                    const assignee = users.find(user => user.user_id === updatedTask.assignee_id);
                    const enrichedTask = {
                        ...updatedTask,
                        assignee_name: assignee ? `${assignee.first_name} ${assignee.last_name}` : null,
                    };
                    setTasks(tasks.map(t => (t.id === taskId ? enrichedTask : t)));
                } catch (error) {
                    console.error("Ошибка обновления задачи:", error);
                    await fetchData();
                }
            }
        }

        setDraggingOver(null);
        setActiveTaskId(null);
        setActiveTask(null);
    };

    const getDynamicGap = () => {
        const columnCount = columns.length;
        if (columnCount <= 3) return '10%';
        if (columnCount === 4) return '7%';
        if (columnCount === 5) return '5%';
        return '3%';
    };

    const renderContent = () => {
        if (activeView === "Чат") {
            return <Chat projectId={projectData.id} />;
        }
        return (
            <DndContext
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
                    <div className="task-columns" style={{ gap: getDynamicGap() }}>
                        {columns.map((column) => (
                            <TaskColumn
                                key={column.id}
                                column={column}
                                tasks={filteredTasks.filter((t) => t.column_id === column.id)}
                                draggingOver={draggingOver}
                                activeTaskId={activeTaskId}
                            />
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                    {activeTask ? <TaskItem task={activeTask} /> : null}
                </DragOverlay>
            </DndContext>
        );
    };

    return (
        <div className="task-board">
            <div className="task-board-header">
                <div className="project-info">
                    {projectData.logo ? (
                        <img src={projectData.logo} alt="Project Logo" className="project-logo" />
                    ) : (
                        <div className="default-logo">
                            <span className="logo-letter">{projectData.title?.[0]?.toUpperCase() || "?"}</span>
                        </div>
                    )}
                    <span className="project-name">{projectData.title}</span>
                    <div className="task-actions">
                        <button className="task-action" onClick={() => setIsModalVisible(true)}>
                            <PlusOutlined /> Добавить задачу
                        </button>
                        <button className="task-action">
                            <FilterOutlined /> Фильтр
                        </button>
                        <button className="task-action">
                            <MoreOutlined /> Еще
                        </button>
                        <div className="task-search">
                            <input
                                type="text"
                                placeholder="Поиск задач..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            <SearchOutlined className="search-icon" />
                        </div>
                    </div>
                </div>
                <button
                    className="task-settings"
                    onClick={() => navigate(`/projects/${projectData.id}/settings`)}
                >
                    <SettingOutlined />
                </button>
            </div>

            <div className="task-content">
                {renderContent()}
                <TaskViewSidebar activeView={activeView} setActiveView={setActiveView} />
            </div>

            <Modal
                title="Создать задачу"
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={handleAddTask}
                okText="Создать"
                cancelText="Отмена"
            >
                <Input
                    placeholder="Название задачи"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    style={{ marginBottom: 10 }}
                />
                <Input.TextArea
                    placeholder="Описание"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    style={{ marginBottom: 10 }}
                />
                <Select
                    value={newTask.priority}
                    onChange={(value) => setNewTask({ ...newTask, priority: value })}
                    style={{ width: "100%", marginBottom: 10 }}
                    placeholder="Выберите приоритет"
                >
                    <Option value="high">Высокий</Option>
                    <Option value="medium">Средний</Option>
                    <Option value="low">Низкий</Option>
                </Select>
                <Select
                    value={newTask.column_id}
                    onChange={(value) => setNewTask({ ...newTask, column_id: value })}
                    style={{ width: "100%", marginBottom: 10 }}
                    placeholder="Выберите столбец"
                >
                    {columns.map(column => (
                        <Option key={column.id} value={column.id}>{column.name}</Option>
                    ))}
                </Select>
                <Select
                    value={newTask.assignee_id}
                    onChange={(value) => setNewTask({ ...newTask, assignee_id: value })}
                    style={{ width: "100%", marginBottom: 10 }}
                    placeholder="Выберите исполнителя"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                    }
                >
                    {users.map(user => (
                        <Option key={user.user_id} value={user.user_id}>
                            {user.first_name} {user.last_name}
                        </Option>
                    ))}
                </Select>
                <DatePicker
                    value={newTask.due_date}
                    onChange={(date) => setNewTask({ ...newTask, due_date: date })}
                    style={{ width: "100%", marginBottom: 10 }}
                    placeholder="Выберите дедлайн"
                    format="YYYY-MM-DD"
                />
            </Modal>
        </div>
    );
};

export default TaskBoard;