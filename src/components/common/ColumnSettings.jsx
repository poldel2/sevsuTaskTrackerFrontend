import React, { useState, useEffect } from 'react';
import { DndContext, closestCorners } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getColumns, createColumn, updateColumn } from '../../services/api';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal, Input } from 'antd';

const SortableColumnItem = ({ column, handlePositionChange }) => {
    const { id, name, position, color } = column;
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
        marginBottom: '10px',
        padding: '5px',
        backgroundColor: color || '#f9f9f9',
        border: '1px solid #ddd'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <span style={{ flex: 1 }}>{name} (Position: {position})</span>
            <button onClick={() => handlePositionChange(id, 'up')} style={{ marginRight: '10px' }}>↑</button>
            <button onClick={() => handlePositionChange(id, 'down')}>↓</button>
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
        [newColumns[columnIndex], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[columnIndex]];

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
            <div className="add-column" style={{ marginTop: '20px' }}>
                <button onClick={() => setIsModalVisible(true)}>Add Column</button>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}

            <Modal
                title="Add New Column"
                visible={isModalVisible}
                onOk={handleAddColumn}
                onCancel={() => {
                    setIsModalVisible(false);
                    setNewColumn({ name: '', position: columns.length, color: '#808080' });
                    setError('');
                }}
                okText="Create"
                cancelText="Cancel"
            >
                <div style={{ marginBottom: '10px' }}>
                    <label>Name:</label>
                    <Input
                        value={newColumn.name}
                        onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                        placeholder="Column name"
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Position:</label>
                    <Input
                        type="number"
                        value={newColumn.position}
                        onChange={(e) => setNewColumn({ ...newColumn, position: parseInt(e.target.value) || 0 })}
                        min={0}
                        placeholder="Position"
                    />
                </div>
                <div>
                    <label>Color:</label>
                    <input
                        type="color"
                        value={newColumn.color}
                        onChange={(e) => setNewColumn({ ...newColumn, color: e.target.value })}
                        style={{ width: '100%', height: '40px', marginTop: '5px' }}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default ColumnSettings;