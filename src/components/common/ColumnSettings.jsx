import React, { useState, useEffect } from 'react';
import { DndContext, closestCorners } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getColumns, createColumn, updateColumn } from '../../services/api';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal, Input, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined } from '@ant-design/icons';

const SortableColumnItem = ({ column, handlePositionChange }) => {
    const { id, name, position } = column;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
        padding: '12px 16px',
        border: '1px solid #5C7BBB',
        borderRadius: '8px',
        background: 'white'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <span style={{ 
                minWidth: '30px',
                color: '#5C7BBB',
                fontWeight: '500'
            }}>
                {position + 1}
            </span>
            <span style={{ flex: 1 }}>{name}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                    type="text"
                    icon={<ArrowUpOutlined />} 
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePositionChange(id, 'up');
                    }}
                />
                <Button 
                    type="text"
                    icon={<ArrowDownOutlined />} 
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePositionChange(id, 'down');
                    }}
                />
            </div>
        </div>
    );
};

const ColumnSettings = ({ projectId }) => {
    const [columns, setColumns] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newColumn, setNewColumn] = useState({
        name: '',
        position: 0,
        color: '#808080'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchColumns();
    }, [projectId]);

    const fetchColumns = async () => {
        try {
            const data = await getColumns(projectId);
            setColumns(data.sort((a, b) => a.position - b.position));
            setNewColumn(prev => ({ ...prev, position: data.length }));
        } catch (err) {
            setError('Failed to load columns');
        }
    };

    const handleAddColumn = async () => {
        if (!newColumn.name.trim()) {
            setError('Column name is required');
            return;
        }
        try {
            const createdColumn = await createColumn(projectId, {
                name: newColumn.name,
                position: newColumn.position,
                color: newColumn.color
            });
            setColumns([...columns, createdColumn]);
            setIsModalVisible(false);
            setNewColumn({ name: '', position: columns.length, color: '#808080' });
            setSuccess('Column added successfully');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError(err.detail || 'Failed to add column');
        }
    };

    const handlePositionChange = async (columnId, direction) => {
        const columnIndex = columns.findIndex(col => col.id === columnId);
        if (direction === 'up' && columnIndex === 0) return;
        if (direction === 'down' && columnIndex === columns.length - 1) return;

        const newColumns = [...columns];
        const targetIndex = direction === 'up' ? columnIndex - 1 : columnIndex + 1;
        
        // Обмениваем столбцы местами
        [newColumns[columnIndex], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[columnIndex]];
        
        // Обновляем позиции для всех столбцов
        newColumns.forEach((col, idx) => {
            col.position = idx;
        });

        try {
            // Сохраняем новые позиции в базе данных
            await Promise.all(newColumns.map(col =>
                updateColumn(projectId, col.id, { 
                    name: col.name, 
                    position: col.position, 
                    color: col.color 
                })
            ));
            
            setColumns(newColumns);
            setSuccess('Позиция столбца обновлена');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError(err.detail || 'Не удалось обновить позицию столбца');
            await fetchColumns(); // Перезагружаем столбцы в случае ошибки
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = columns.findIndex(col => col.id === active.id);
            const newIndex = columns.findIndex(col => col.id === over.id);
            const newColumns = arrayMove(columns, oldIndex, newIndex);

            try {
                await Promise.all(newColumns.map((col, idx) =>
                    updateColumn(projectId, col.id, { name: col.name, position: idx, color: col.color })
                ));
                setColumns(newColumns);
                setSuccess('Column position updated');
                setTimeout(() => setSuccess(''), 2000);
            } catch (err) {
                setError(err.detail || 'Failed to update column position');
                fetchColumns();
            }
        }
    };

    return (
        <div className="column-settings">
            <h2>Настройки столбцов</h2>
            <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                <SortableContext items={columns.map(col => col.id)} strategy={verticalListSortingStrategy}>
                    <div className="columns-list" style={{ marginTop: '20px' }}>
                        {columns.map(column => (
                            <SortableColumnItem
                                key={column.id}
                                column={column}
                                handlePositionChange={handlePositionChange}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
                style={{ 
                    marginTop: '20px',
                    background: '#5C7BBB',
                    borderColor: '#5C7BBB'
                }}
            >
                Добавить столбец
            </Button>

            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            {success && <p style={{ color: 'green', marginTop: '10px' }}>{success}</p>}

            <Modal
                title="Новый столбец"
                open={isModalVisible}
                onOk={handleAddColumn}
                onCancel={() => {
                    setIsModalVisible(false);
                    setNewColumn({ name: '', position: columns.length, color: '#808080' });
                    setError('');
                }}
                okText="Создать"
                cancelText="Отмена"
            >
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>Название столбца:</label>
                    <Input
                        value={newColumn.name}
                        onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                        placeholder="Введите название столбца"
                    />
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>Позиция:</label>
                    <Input
                        type="number"
                        value={newColumn.position}
                        onChange={(e) => setNewColumn({ ...newColumn, position: parseInt(e.target.value) || 0 })}
                        min={0}
                        placeholder="Укажите позицию"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px' }}>Цвет столбца:</label>
                    <input
                        type="color"
                        value={newColumn.color}
                        onChange={(e) => setNewColumn({ ...newColumn, color: e.target.value })}
                        style={{ 
                            width: '100%', 
                            height: '40px', 
                            padding: '0',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px'
                        }}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default ColumnSettings;