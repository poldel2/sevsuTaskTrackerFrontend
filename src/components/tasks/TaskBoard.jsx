import React, { useState, useEffect } from "react";
import "../../styles/TaskBoard.css";
import TaskViewSidebar from "../layout/TaskViewSidebar";
import { Modal, Input, Select, DatePicker, message, Dropdown, Menu, Checkbox, Button, Space } from "antd";
import {
    PlusOutlined,
    FilterOutlined,
    MoreOutlined,
    SettingOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { getTasks, addTask, updateTask, getColumns, updateColumn, getProjectUsers, getImageUrl } from "../../services/api";
import {
    DndContext,
    closestCorners,
    DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskColumn } from "./TaskColumn";
import TaskItem from "./TaskItem.jsx";
import Chat from "../common/Chat";
import { useNavigate } from "react-router-dom";
import TaskCalendar from "./TaskCalendar.jsx";
import moment from 'moment';
import TaskTimeline from "./Timeline";
import TaskList from './TaskList';

const { Option } = Select;

const priorityLabels = {
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
};

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
    const [appliedFilters, setAppliedFilters] = useState({
        priority: [],
        column_id: [],
    });

    const handleFilterChange = (filterType, values) => {
        setAppliedFilters(prev => ({
            ...prev,
            [filterType]: values,
        }));
    };

    const resetFilters = () => {
        setAppliedFilters({ priority: [], column_id: [] });
    };

    const filterMenu = (
        <Menu style={{ padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 'bold' }}>Приоритет:</p>
                <Checkbox.Group
                    options={Object.entries(priorityLabels).map(([value, label]) => ({ label, value }))}
                    value={appliedFilters.priority}
                    onChange={(values) => handleFilterChange('priority', values)}
                />
            </div>
            <div style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 'bold' }}>Статус:</p>
                <Checkbox.Group
                    options={columns.map(col => ({ label: col.name, value: col.id }))}
                    value={appliedFilters.column_id}
                    onChange={(values) => handleFilterChange('column_id', values)}
                />
            </div>
            <Button onClick={resetFilters} type="link">Сбросить все фильтры</Button>
        </Menu>
    );

    const isFiltersApplied = appliedFilters.priority.length > 0 || appliedFilters.column_id.length > 0;

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
                const assignee = usersData.find(user => user.id === task.assignee_id);
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

    const filteredTasks = tasks.filter((task) => {
        const searchMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const priorityMatch = appliedFilters.priority.length === 0 || appliedFilters.priority.includes(task.priority);
        const statusMatch = appliedFilters.column_id.length === 0 || appliedFilters.column_id.includes(task.column_id);
        
        return searchMatch && priorityMatch && statusMatch;
    });

    const handleDragStart = (event) => {
        const { active } = event;
        setDraggingOver(null);
        
        if (active.data.current && active.data.current.type === 'task') {
            setActiveTask(tasks.find((task) => task.id === active.id));
            setActiveTaskId(active.id);
        }
    };

    const handleDragOver = (event) => {
        const { over, active } = event;
        if (!over) {
            setDraggingOver(null);
            return;
        }

        if (active.data?.current?.type !== 'task') {
            return;
        }

        const taskId = active.id;
        const activeTask = tasks.find(t => t.id === taskId);
        
        const activeColumn = columns.find(col => col.id === activeTask?.column_id);
        const sourcePosition = activeColumn?.position;
        
        let targetColumnId = null;
        let targetPosition = null;
        
        const overColumn = columns.find(col => col.id === over.id);
        if (overColumn) {
            targetColumnId = overColumn.id;
            targetPosition = overColumn.position;
        } else {
            const overTask = tasks.find(t => t.id === over.id);
            if (overTask) {
                const taskColumn = columns.find(col => col.id === overTask.column_id);
                targetColumnId = taskColumn?.id;
                targetPosition = taskColumn?.position;
            }
        }
        
        if (targetColumnId && targetPosition !== sourcePosition) {
            console.log(`Наведение: с позиции ${sourcePosition} на позицию ${targetPosition}, столбец ${targetColumnId}`);
            setDraggingOver(targetColumnId);
        } else {
            setDraggingOver(null);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeType = active.data?.current?.type;
        
        if (activeType === 'task') {
            const taskId = activeId;
            let newColumnId = null;
            
            const overColumn = columns.find(col => col.id === overId);
            if (overColumn) {
                newColumnId = overColumn.id;
                console.log(`Перетаскивание в столбец с position ${overColumn.position}`);
            } else {
                const overTask = tasks.find(t => t.id === overId);
                if (overTask) {
                    const taskColumn = columns.find(col => col.id === overTask.column_id);
                    newColumnId = taskColumn?.id;
                    console.log(`Перетаскивание на задачу в столбце с position ${taskColumn?.position}`);
                }
            }
            
            const activeTask = tasks.find(t => t.id === taskId);
            const currentColumnId = activeTask ? activeTask.column_id : null;
            
            if (newColumnId && newColumnId !== currentColumnId) {
                try {
                    console.log(`Обновляем задачу ${taskId}: перемещение из столбца ${currentColumnId} в столбец ${newColumnId}`);
                    
                    const updatedTask = await updateTask(taskId, projectData.id, {
                        column_id: newColumnId
                    });
                    
                    const assignee = users.find(user => user.id === updatedTask.assignee_id);
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

    const handleTaskUpdate = (updatedTask) => {
        if (updatedTask) {
            setTasks(prevTasks => 
                prevTasks.map(task => {
                    if (task.id === updatedTask.id) {
                        const newTask = { ...task, ...updatedTask };
                        if (updatedTask.assignee_id !== undefined) {
                            const assignee = users.find(u => u.id === updatedTask.assignee_id);
                            newTask.assignee_name = assignee ? `${assignee.first_name} ${assignee.last_name}` : null;
                        }
                        return newTask;
                    }
                    return task;
                })
            );
        } else {
            fetchData();
        }
    };

    const renderContent = () => {
        if (activeView === "Чат") {
            return <Chat projectId={projectData.id} />;
        } else if (activeView === "Календарь") {
            return <TaskCalendar tasks={filteredTasks} />;
        } else if (activeView === "Список") {
            return (
                <div className="task-list-view-wrapper">
                    <TaskList 
                        tasks={filteredTasks}
                        onUpdate={fetchData}
                        projectId={projectData.id}
                        columns={columns}
                    />
                </div>
            );
        } else if (activeView === "Хронология") {
            return <TaskTimeline 
                tasks={filteredTasks}
                onTaskUpdate={handleTaskUpdate}
                projectId={projectData.id}
            />;
        }
        return (
            <DndContext
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="task-columns" style={{ gap: getDynamicGap() }}>
                    {columns.map((column) => (
                        <TaskColumn
                            key={column.id}
                            column={column}
                            tasks={filteredTasks.filter((t) => t.column_id === column.id)}
                            draggingOver={draggingOver}
                            activeTaskId={activeTaskId}
                            handleTaskUpdate={handleTaskUpdate}
                            disableDrag={true}
                        />
                    ))}
                </div>
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
                        <img src={getImageUrl(projectData.logo)} alt="Project Logo" className="project-logo" />
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
                        <Dropdown overlay={filterMenu} trigger={['click']}>
                            <button 
                                className="task-action" 
                                style={isFiltersApplied ? { color: '#1677ff', borderColor: '#1677ff' } : {}}
                            >
                                <FilterOutlined /> 
                                Фильтр {isFiltersApplied ? `(${appliedFilters.priority.length + appliedFilters.column_id.length})` : ''}
                            </button>
                        </Dropdown>
                        <button className="task-action">
                            <MoreOutlined /> Еще
                        </button>
                        <div className="task-search">
                            <input
                                type="text"
                                placeholder="Поиск задач..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input-task"
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
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <TaskViewSidebar activeView={activeView} setActiveView={setActiveView} />
                    <button 
                        className="chat-button"
                        onClick={() => setActiveView("Чат")}
                    >
                        <img src="/assets/chat_icon.svg" alt="chat" className="chat-icon" />
                    </button>
                </div>
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
                    onChange={(value) => {
                        setNewTask({ ...newTask, assignee_id: value });
                    }}
                    style={{ width: "100%", marginBottom: 10 }}
                    placeholder="Выберите исполнителя"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) => {
                        const children = option.children || '';
                        return children.includes(input);
                    }}
                >
                    {users.map(user => (
                        <Option key={user.id} value={user.id}>
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