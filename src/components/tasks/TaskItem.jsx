import React, { useState, useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import TaskModal from "./TaskModal";
import '../../styles/TaskItem.css';
// Глобальное состояние для отслеживания модального окна
let isModalOpenState = false;
let modalOpenCallbackFunction = null;

// Функция для установки глобального состояния модального окна
export const setModalOpenState = (isOpen) => {
    isModalOpenState = isOpen;
    if (modalOpenCallbackFunction) {
        modalOpenCallbackFunction(isOpen);
    }
};

// Функция для проверки, открыто ли модальное окно
export const isModalOpen = () => isModalOpenState;

// Функция для установки обработчика изменения состояния
export const setModalOpenCallback = (callback) => {
    modalOpenCallbackFunction = callback;
};

const priorityColors = {
    high: "red",
    medium: "yellow",
    low: "#2de627",
};

const priorityOptions = [
    { value: "high", label: "Высокий", color: "red" },
    { value: "medium", label: "Средний", color: "orange" },
    { value: "low", label: "Низкий", color: "green" },
];

const TaskItem = ({ task, activeTaskId, handleTaskUpdate }) => {
    const navigate = useNavigate();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const cleanupRef = useRef(null);

    const { attributes, listeners, setNodeRef } = useSortable({
        id: task.id,
        data: { type: 'task', columnId: task.column_id }
    });

    const isDragged = task.id === activeTaskId;
    const style = isDragged ? { opacity: 0.5 } : {};

    // Обновление глобального состояния модального окна
    useEffect(() => {
        if (isModalVisible) {
            setModalOpenState(true);
            // Отключаем drag-and-drop при открытии модального окна
            disableDragEvents();
        } else {
            setModalOpenState(false);
            // Восстанавливаем drag-and-drop при закрытии модального окна
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        }
        return () => {
            if (isModalVisible) {
                setModalOpenState(false);
                if (cleanupRef.current) {
                    cleanupRef.current();
                    cleanupRef.current = null;
                }
            }
        };
    }, [isModalVisible]);

    // Функция для остановки событий перетаскивания
    const disableDragEvents = () => {
        // Добавляем класс, который отключит drag-and-drop
        document.body.classList.add('modal-open');
        
        // Предотвращаем работу dnd-kit
        const preventDndEvent = (e) => {
            // Останавливаем все события drag-and-drop
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        };
        
        // Применяем обработчики ко всем событиям мыши и касания
        const events = [
            'mousedown', 'mousemove', 'mouseup',
            'touchstart', 'touchmove', 'touchend',
            'pointerdown', 'pointermove', 'pointerup',
            'dragstart', 'dragover', 'dragend'
        ];
        
        // Добавляем обработчики к документу
        events.forEach(event => {
            document.addEventListener(event, preventDndEvent, { capture: true });
        });
        
        const cleanup = () => {
            document.body.classList.remove('modal-open');
            events.forEach(event => {
                document.removeEventListener(event, preventDndEvent, { capture: true });
            });
        };

        cleanupRef.current = cleanup;
        return cleanup;
    };

    // Открытие модального окна
    const handleOpenModal = (e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setIsModalVisible(true);
        disableDragEvents();
    };

    // Обработчик закрытия модального окна
    const handleModalClose = () => {
        setIsModalVisible(false);
    };

    return (
        <>
            <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="task-item">
                <div className="task-header">
                    <span className="task-name">{task.title}</span>
                    <span className="task-priority" style={{ backgroundColor: priorityColors[task.priority] }}></span>
                </div>
                <div className="task-footer">
                    <span className="task-assignee">{task.assignee_name || "Без исполнителя"}</span>
                </div>
                <EditOutlined className="task-edit-icon" onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal(e);
                }} />

                <div 
                    className="task-add-section-wrapper"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (task.id) {
                            navigate(`/projects/${task.project_id}/tasks/${task.id}`);
                        }
                    }}
                >
                    <button 
                        className="task-add-section"
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (task.id) {
                                navigate(`/projects/${task.project_id}/tasks/${task.id}`);
                            }
                        }}
                    >
                        <span>Дополнительные параметры</span>
                        <RightOutlined className="task-add-icon" />
                    </button>
                </div>
            </div>

            <TaskModal
                task={task}
                visible={isModalVisible}
                onCancel={handleModalClose}
                onUpdate={handleTaskUpdate}
            />
        </>
    );
};

export default TaskItem;