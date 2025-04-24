import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskItem from './TaskItem';

export const TaskColumn = ({ column, tasks, draggingOver, activeTaskId, handleTaskUpdate, disableDrag }) => {
    const { id, name, color, position } = column;

    // Используем useDroppable для приема перетаскиваемых элементов
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: id,
        data: { 
            type: 'column', 
            columnId: id,
            position: position
        }
    });

    const style = disableDrag ? {} : {
        // style для draggable элементов
    };

    const headerStyle = {
        backgroundColor: color,
        cursor: disableDrag ? 'default' : 'grab'
    };

    // Обработчик обновления задачи для колонки
    const handleTaskUpdateInColumn = (updatedTask) => {
        if (handleTaskUpdate) {
            handleTaskUpdate(updatedTask);
        }
    };

    const isHighlighted = isOver || draggingOver === id;

    return (
        <div
            ref={setDroppableRef}
            style={style}
            className={`task-column ${isHighlighted ? 'column-hover' : ''}`}
            data-column-id={id}
            data-position={position}
        >
            <div 
                className="task-column-title"
                style={headerStyle}
            >
                {name}
            </div>

            <div className="task-column-body">
                <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            activeTaskId={activeTaskId}
                            handleTaskUpdate={handleTaskUpdateInColumn}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};