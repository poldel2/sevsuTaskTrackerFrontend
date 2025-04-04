import React from "react";
import "../../styles/TaskViewSidebar.css";
import { CalendarOutlined, BarsOutlined, ProjectOutlined, OrderedListOutlined, TableOutlined } from '@ant-design/icons';

const views = [
    "Доска",
    "Список",
    "Календарь",
    "Хронология",
    "Чат",
    "Формы",
    "Страницы",
    "Отчёты",
    "Вложения",
    "Компоненты",
    "Архив",
];

const TaskViewSidebar = ({ activeView, setActiveView }) => {
    return (
        <div className="task-view-sidebar">
            {views.map((view) => (
                <div
                    key={view}
                    className={`task-view-item ${activeView === view ? "active" : ""}`}
                    onClick={() => setActiveView(view)}
                >
                    {view}
                </div>
            ))}
        </div>
    );
};

export default TaskViewSidebar;