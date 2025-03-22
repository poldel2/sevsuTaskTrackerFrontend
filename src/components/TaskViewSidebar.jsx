import React from "react";
import "../styles/TaskViewSidebar.css";

const views = [
    "Доска",
    "Список",
    "Календарь",
    "Задачи",
    "Чат", // Добавляем чат
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