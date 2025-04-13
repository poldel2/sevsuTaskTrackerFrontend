import React, { useState, useEffect } from 'react';
import moment from 'moment';
import TaskModal from './TaskModal';
import '../../styles/TaskListCustom.css';

const priorityColors = {
    high: '#dc3545',
    medium: '#ffc107',
    low: '#28a745',
};

const priorityLabels = {
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
};

const TaskList = ({ tasks = [], onUpdate, projectId, columns: boardColumns = [] }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });

    const handleRowClick = (task) => {
        setSelectedTask({ ...task, project_id: projectId });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedTask(null);
    };

    const handleUpdate = () => {
        setIsModalVisible(false);
        setSelectedTask(null);
        if (onUpdate) {
            onUpdate();
        }
    };

    const getColumnName = (columnId) => {
        const column = boardColumns.find(col => col.id === columnId);
        return column ? column.name : 'Неизвестно';
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'none';
            key = null;
        }
        setSortConfig({ key, direction });
    };

    const getSortDirectionClass = (key) => {
        if (!sortConfig.key || sortConfig.key !== key || sortConfig.direction === 'none') {
            return 'sortable';
        }
        return sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc';
    };

    const sortedTasks = React.useMemo(() => {
        let sortableItems = [...tasks];
        if (sortConfig.key !== null && sortConfig.direction !== 'none') {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'priority') {
                    const priorityOrder = { low: 0, medium: 1, high: 2 };
                    aValue = priorityOrder[aValue];
                    bValue = priorityOrder[bValue];
                } else if (sortConfig.key === 'due_date') {
                    const aDate = aValue ? moment(aValue).unix() : (sortConfig.direction === 'asc' ? Infinity : -Infinity);
                    const bDate = bValue ? moment(bValue).unix() : (sortConfig.direction === 'asc' ? Infinity : -Infinity);
                    return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
                } else if (sortConfig.key === 'assignee_name') {
                    aValue = aValue || '';
                    bValue = bValue || '';
                } else if (sortConfig.key === 'column_id') {
                    aValue = getColumnName(aValue);
                    bValue = getColumnName(bValue);
                } else if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [tasks, sortConfig, boardColumns]);

    if (!tasks || tasks.length === 0) {
        return <div className="no-tasks-message"><p>Нет задач для отображения</p></div>;
    }

    return (
        <div className="custom-task-list task-list-table-override">
            <table className="custom-task-list-table">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('title')} className={getSortDirectionClass('title')}>
                            Название
                        </th>
                        <th onClick={() => requestSort('priority')} className={getSortDirectionClass('priority')}>
                            Приоритет
                        </th>
                        <th onClick={() => requestSort('due_date')} className={getSortDirectionClass('due_date')}>
                            Дедлайн
                        </th>
                        <th onClick={() => requestSort('assignee_name')} className={getSortDirectionClass('assignee_name')}>
                            Исполнитель
                        </th>
                        <th onClick={() => requestSort('column_id')} className={getSortDirectionClass('column_id')}>
                            Статус
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTasks.map(task => (
                        <tr key={task.id} onClick={() => handleRowClick(task)} className="clickable-row">
                            <td>{task.title}</td>
                            <td>
                                <span 
                                    className="priority-tag"
                                    style={{ backgroundColor: priorityColors[task.priority] || '#6c757d' }}
                                >
                                    {priorityLabels[task.priority] || task.priority}
                                </span>
                            </td>
                            <td>{task.due_date ? moment(task.due_date).format('DD.MM.YYYY') : '-'}</td>
                            <td>{task.assignee_name || <span className="unassigned-tag">Не назначен</span>}</td>
                            <td>{getColumnName(task.column_id)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    visible={isModalVisible}
                    onCancel={handleCancel}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
};

export default TaskList; 