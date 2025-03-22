import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditOutlined, RightOutlined } from "@ant-design/icons";

const priorityColors = {
    high: "red",
    medium: "yellow",
    low: "#2de627",
};

const TaskItem = ({ task, activeTaskId }) => {
    const { attributes, listeners, setNodeRef } = useSortable({
        id: task.id,
        data: { type: 'task', columnId: task.column_id }
    });

    const isDragged = task.id === activeTaskId;
    const style = isDragged ? { opacity: 0.5 } : {};

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="task-item">
            <div className="task-header">
                <span className="task-name">{task.title}</span>
                <span className="task-priority" style={{ backgroundColor: priorityColors[task.priority] }}></span>
            </div>
            <div className="task-footer">
                <span className="task-assignee">{task.assignee_name || "Без исполнителя"}</span>
            </div>
            <EditOutlined className="task-edit-icon" />
            <button className="task-add-section">
                Дополнительные параметры <RightOutlined className="task-add-icon" />
            </button>
        </div>
    );
};

export default TaskItem;