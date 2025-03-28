import React, { useState, useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditOutlined, RightOutlined } from "@ant-design/icons";
import { Modal, Form, Input, Select, DatePicker, Button, Spin, message, Divider } from "antd";
import { getProjectUsers, getColumns, updateTask } from "../services/api";
import moment from "moment";

const { Option } = Select;
const { TextArea } = Input;

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

const TaskItem = ({ task, activeTaskId }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [columns, setColumns] = useState([]);
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

    // Открытие модального окна с загрузкой данных
    const handleOpenModal = async (e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        
        setIsModalVisible(true);
        setLoading(true);
        disableDragEvents();
        
        try {
            const projectId = task.project_id;
            const [usersData, columnsData] = await Promise.all([
                getProjectUsers(projectId),
                getColumns(projectId)
            ]);
            
            setUsers(usersData);
            setColumns(columnsData);
            
            form.setFieldsValue({
                title: task.title,
                description: task.description || "",
                priority: task.priority,
                column_id: task.column_id,
                assignee_id: task.assignee_id,
                due_date: task.due_date ? moment(task.due_date) : null,
                estimated_hours: task.estimated_hours || null,
                actual_hours: task.actual_hours || null,
                tags: task.tags || []
            });
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
            message.error("Не удалось загрузить данные");
            setIsModalVisible(false);
        } finally {
            setLoading(false);
        }
    };

    // Обработчик сохранения изменений
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            const updatedValues = {
                ...values,
                due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null
            };
            
            await updateTask(task.id, task.project_id, updatedValues);
            message.success("Задача успешно обновлена");
            setIsModalVisible(false);
            
            // Обновление UI
            window.location.reload();
        } catch (error) {
            console.error("Ошибка при сохранении задачи:", error);
            message.error("Не удалось обновить задачу");
        } finally {
            setLoading(false);
        }
    };

    // Обработчик закрытия модального окна
    const handleCancel = () => {
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
                        handleOpenModal(e);
                    }}
                >
                    <button 
                        className="task-add-section"
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(e);
                        }}
                    >
                        Дополнительные параметры <RightOutlined className="task-add-icon" />
                    </button>
                </div>
            </div>

            <Modal
                title="Редактирование задачи"
                open={isModalVisible}
                onOk={handleSave}
                onCancel={handleCancel}
                width={800}
                destroyOnClose
                maskClosable={false}
                className="task-edit-modal"
                style={{ zIndex: 1050 }}
                mask={true}
                maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
            >
                <Spin spinning={loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{
                            title: task.title,
                            description: task.description || "",
                            priority: task.priority,
                            column_id: task.column_id,
                            assignee_id: task.assignee_id,
                            due_date: task.due_date ? moment(task.due_date) : null,
                            estimated_hours: task.estimated_hours || null,
                            actual_hours: task.actual_hours || null,
                            tags: task.tags || []
                        }}
                    >
                        <Form.Item
                            name="title"
                            label="Название"
                            rules={[{ required: true, message: "Введите название задачи" }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item name="description" label="Описание">
                            <TextArea rows={4} />
                        </Form.Item>

                        <Form.Item name="priority" label="Приоритет">
                            <Select>
                                {priorityOptions.map(option => (
                                    <Option key={option.value} value={option.value}>
                                        <span style={{ color: option.color }}>{option.label}</span>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="column_id" label="Статус">
                            <Select>
                                {columns.map(column => (
                                    <Option key={column.id} value={column.id}>
                                        {column.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="assignee_id" label="Исполнитель">
                            <Select allowClear>
                                {users.map(user => (
                                    <Option key={user.id} value={user.id}>
                                        {`${user.first_name} ${user.last_name}`}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="due_date" label="Срок выполнения">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item name="estimated_hours" label="Оценочные часы">
                            <Input type="number" min={0} step={0.5} />
                        </Form.Item>

                        <Form.Item name="actual_hours" label="Фактические часы">
                            <Input type="number" min={0} step={0.5} />
                        </Form.Item>

                        <Form.Item name="tags" label="Теги">
                            <Select mode="tags" style={{ width: '100%' }} />
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </>
    );
};

export default TaskItem;