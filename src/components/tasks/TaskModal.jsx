import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, Spin, message } from "antd";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/DatePicker.css";
import { getProjectUsers, getColumns, updateTask } from "../../services/api";
import moment from "moment";
import "moment/locale/ru";

// Устанавливаем русскую локаль для moment
moment.locale("ru");

const { Option } = Select;
const { TextArea } = Input;

const priorityOptions = [
    { value: "high", label: "Высокий", color: "red" },
    { value: "medium", label: "Средний", color: "orange" },
    { value: "low", label: "Низкий", color: "green" },
];

const TaskModal = ({ task, visible, onCancel, onUpdate }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [columns, setColumns] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        if (visible && task) {
            setLoading(true);
            const projectId = task.project_id;
            Promise.all([
                getProjectUsers(projectId),
                getColumns(projectId)
            ]).then(([usersData, columnsData]) => {
                setUsers(usersData);
                setColumns(columnsData);
                const initialDate = task.due_date ? new Date(task.due_date) : null;
                setSelectedDate(initialDate);
                form.setFieldsValue({
                    title: task.title,
                    description: task.description || "",
                    priority: task.priority,
                    column_id: task.column_id,
                    assignee_id: task.assignee_id,
                    due_date: initialDate,
                    estimated_hours: task.estimated_hours || null,
                    actual_hours: task.actual_hours || null,
                    tags: task.tags || []
                });
            }).catch(error => {
                console.error("Ошибка загрузки данных:", error);
                message.error("Не удалось загрузить данные");
                onCancel();
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [visible, task, form, onCancel]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            // Собираем только измененные поля
            const changedValues = {};
            
            Object.keys(values).forEach(key => {
                const initialValue = task[key];
                let newValue = values[key];
                
                // Обработка даты
                if (key === 'due_date') {
                    const initialDate = initialValue ? moment(initialValue).format('YYYY-MM-DD') : null;
                    const newDate = newValue ? moment(newValue).format('YYYY-MM-DD') : null;
                    if (initialDate !== newDate) {
                        changedValues[key] = newDate;
                    }
                }
                // Обработка остальных полей
                else if (newValue !== initialValue) {
                    changedValues[key] = newValue;
                }
            });
            
            // Отправляем запрос только если есть изменения
            if (Object.keys(changedValues).length > 0) {
                await updateTask(task.id, task.project_id, changedValues);
                message.success("Задача успешно обновлена");
                if (onUpdate) {
                    onUpdate();
                }
            }
            onCancel();
            
        } catch (error) {
            console.error("Ошибка при сохранении задачи:", error);
            message.error("Не удалось обновить задачу");
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        form.setFieldValue('due_date', date);
    };

    return (
        <Modal
            title="Редактирование задачи"
            open={visible}
            onOk={handleSave}
            onCancel={onCancel}
            width={800}
            destroyOnClose
            className="task-edit-modal"
            style={{ zIndex: 1050 }}
            mask={true}
            styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' } }}
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
                        due_date: task.due_date ? new Date(task.due_date) : null,
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
                        <DatePicker
                            selected={selectedDate}
                            onChange={handleDateChange}
                            dateFormat="dd.MM.yyyy"
                            className="ant-input"
                            placeholderText="Выберите дату"
                        />
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
    );
};

export default TaskModal;