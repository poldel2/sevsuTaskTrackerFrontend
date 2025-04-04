import React, { useState, useEffect } from 'react';
import { Table, Tag, Empty } from 'antd';
import moment from 'moment';
import TaskModal from './TaskModal';
import '../../styles/App.css';

const priorityColors = {
    high: 'red',
    medium: 'orange',
    low: 'green',
};

const priorityLabels = {
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
};

const TaskList = ({ tasks, onUpdate, projectId, columns: boardColumns }) => { 
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1,
            pageSize: 15,
        },
        sorter: {},
    });

    useEffect(() => {
        setTableParams(prev => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                current: 1,
            },
        }));
    }, [tasks]);

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

    const handleTableChange = (pagination, _tableFilters, sorter) => {
        setTableParams({
            pagination,
            sorter: Array.isArray(sorter) ? sorter[0] : sorter,
        });
    };

    const getColumnName = (columnId) => {
        const column = boardColumns.find(col => col.id === columnId);
        return column ? column.name : 'Неизвестно';
    };

    const columns = [
        {
            title: 'Название',
            dataIndex: 'title',
            key: 'title',
            sorter: (a, b) => a.title.localeCompare(b.title),
            sortOrder: tableParams.sorter?.field === 'title' && tableParams.sorter?.order,
            render: (text, record) => <a onClick={(e) => { e.stopPropagation(); handleRowClick(record); }}>{text}</a>,
            ellipsis: true, 
        },
        {
            title: 'Приоритет',
            dataIndex: 'priority',
            key: 'priority',
            width: 120, 
            sorter: (a, b) => {
                const priorityOrder = { low: 0, medium: 1, high: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            },
            sortOrder: tableParams.sorter?.field === 'priority' && tableParams.sorter?.order,
            render: (priority) => (
                <Tag color={priorityColors[priority] || 'default'}>
                    {priorityLabels[priority] || priority}
                </Tag>
            ),
        },
        {
            title: 'Дедлайн',
            dataIndex: 'due_date',
            key: 'due_date',
            width: 120,
            sorter: (a, b) => moment(a.due_date).unix() - moment(b.due_date).unix(),
            sortOrder: tableParams.sorter?.field === 'due_date' && tableParams.sorter?.order,
            render: (date) => (date ? moment(date).format('DD.MM.YYYY') : 'Нет'),
        },
        {
            title: 'Исполнитель',
            dataIndex: 'assignee_name',
            key: 'assignee_name',
            width: 180,
            sorter: (a, b) => (a.assignee_name || '').localeCompare(b.assignee_name || ''),
            sortOrder: tableParams.sorter?.field === 'assignee_name' && tableParams.sorter?.order,
            render: (name) => name || <Tag>Не назначен</Tag>,
            ellipsis: true,
        },
         {
            title: 'Статус',
            dataIndex: 'column_id',
            key: 'column_id',
            width: 150,
            render: (columnId) => getColumnName(columnId), 
            sorter: (a, b) => getColumnName(a.column_id).localeCompare(getColumnName(b.column_id)),
            sortOrder: tableParams.sorter?.field === 'column_id' && tableParams.sorter?.order,
        },
    ];

    return (
        <div className="task-list-container task-list-table-override" style={{ padding: '20px', background: '#fff', borderRadius: '8px' }}>
            <Table
                columns={columns}
                dataSource={tasks.map(task => ({ ...task, key: task.id }))}
                rowClassName="task-list-row"
                onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                })}
                pagination={tableParams.pagination}
                onChange={handleTableChange}
                style={{ cursor: 'pointer' }}
                scroll={{ y: 'calc(100vh - 300px)', x: 'max-content' }}
                size="middle"
                showSorterTooltip={false}
                locale={{
                    emptyText: <Empty description="Нет задач для отображения" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                }}
            />
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