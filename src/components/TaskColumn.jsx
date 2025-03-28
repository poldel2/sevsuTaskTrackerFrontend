import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskItem from './TaskItem';

export const TaskColumn = ({ column, tasks, draggingOver, activeTaskId }) => {
    const { id, name, color } = column;

    const {
        attributes,
        listeners,
        setNodeRef: setSortableRef,
        transform,
        transition
    } = useSortable({
        id: id,
        data: { type: 'column', columnId: id }
    });

    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: id,
        data: { columnId: id }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const headerStyle = {
        backgroundColor: color,
        cursor: 'grab'
    };

    return (
        <div
            ref={(node) => {
                setSortableRef(node);
                setDroppableRef(node);
            }}
            style={style}
            className={`task-column ${isOver || draggingOver === id ? 'column-hover' : ''}`}
        >
            <div 
                className="task-column-title"
                style={headerStyle}
                {...attributes}
                {...listeners}
            >
                {name}
            </div>

            <div className="task-column-body">
                <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <TaskItem key={task.id} task={task} activeTaskId={activeTaskId} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};