import React, { useState, useEffect, useRef } from 'react';
import { DatePicker, Spin, message, Radio } from 'antd';
import moment from 'moment';
import 'moment/locale/ru';
import { updateTask } from '../services/api';
import '../styles/Timeline.css';
import TaskModal from './TaskModal';

// Устанавливаем русскую локаль для moment
moment.locale("ru");

const { RangePicker } = DatePicker;
const { Button, Group } = Radio;

const TaskTimeline = ({ tasks, onTaskUpdate, projectId }) => {
    const [loading, setLoading] = useState(false);
    const [timelineData, setTimelineData] = useState([]);
    const [startDate, setStartDate] = useState(moment().startOf('month'));
    const [endDate, setEndDate] = useState(moment().endOf('month').add(2, 'months'));
    const [timeUnits, setTimeUnits] = useState([]);
    const [viewScale, setViewScale] = useState('month');
    const [resizingTask, setResizingTask] = useState(null);
    const [resizeStartX, setResizeStartX] = useState(0);
    const [initialDate, setInitialDate] = useState(null);
    const [tempTimelineData, setTempTimelineData] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (tasks) {
            const sortedTasks = [...tasks].sort((a, b) => 
                moment(a.created_at).valueOf() - moment(b.created_at).valueOf()
            );

            const timelineItems = sortedTasks.map(task => ({
                ...task,
                startDate: moment(task.created_at).clone(),
                endDate: moment(task.due_date).clone()
            }));

            setTimelineData(timelineItems);
            setTempTimelineData(timelineItems);
        }
    }, [tasks]);

    useEffect(() => {
        const unitsArray = [];
        let currentDate = moment(startDate).clone();
        const end = moment(endDate).clone();
        
        while (currentDate.isSameOrBefore(end)) {
            unitsArray.push(currentDate.clone());
            currentDate.add(1, viewScale === 'month' ? 'month' : 'week');
        }
        
        setTimeUnits(unitsArray);
    }, [startDate, endDate, viewScale]);

    const handleDateChange = async (taskId, newDate) => {
        if (!newDate || !projectId) return;
        
        try {
            setLoading(true);
            const task = tempTimelineData.find(t => t.id === taskId);
            if (!task) return;

            await updateTask(taskId, projectId, {
                due_date: newDate.format('YYYY-MM-DD')
            });
            
            if (onTaskUpdate) {
                onTaskUpdate();
            }
            
            message.success('Срок выполнения задачи обновлен');
        } catch (error) {
            console.error('Error updating task:', error);
            message.error('Не удалось обновить срок выполнения');
        } finally {
            setLoading(false);
        }
    };

    const handleResizeStart = (e, task) => {
        e.stopPropagation();
        setResizingTask(task);
        setResizeStartX(e.clientX);
        setInitialDate(moment(task.due_date).clone());
    };

    const handleResizeMove = (e) => {
        if (!resizingTask || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - resizeStartX;
        const containerWidth = containerRect.width;
        const daysPerPixel = moment(endDate).diff(startDate, 'days') / containerWidth;
        const daysDelta = Math.round(deltaX * daysPerPixel);

        const newDate = moment(initialDate).clone().add(daysDelta, 'days');
        
        if (newDate.isAfter(moment(resizingTask.created_at))) {
            setTempTimelineData(prevData => {
                const newData = prevData.map(task => 
                    task.id === resizingTask.id 
                        ? { 
                            ...task, 
                            endDate: newDate.clone(),
                            due_date: newDate.format('YYYY-MM-DD')
                        }
                        : task
                );
                return newData;
            });
        }
    };

    const handleResizeEnd = async () => {
        if (resizingTask) {
            const updatedTask = tempTimelineData.find(t => t.id === resizingTask.id);
            
            if (updatedTask) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const deltaX = window.event.clientX - resizeStartX;
                const containerWidth = containerRect.width;
                const daysPerPixel = moment(endDate).diff(startDate, 'days') / containerWidth;
                const daysDelta = Math.round(deltaX * daysPerPixel);
                const newDate = moment(initialDate).clone().add(daysDelta, 'days');
                
                if (newDate.isAfter(moment(resizingTask.created_at))) {
                    await handleDateChange(resizingTask.id, newDate);
                } else {
                    setTempTimelineData(timelineData);
                }
            }
        }
        setResizingTask(null);
        setResizeStartX(0);
        setInitialDate(null);
    };

    useEffect(() => {
        if (resizingTask) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [resizingTask]);

    const getTaskPosition = (task) => {
        const taskStart = moment(task.created_at).startOf('day');
        const taskEnd = moment(task.due_date).endOf('day');
        const timelineStart = moment(startDate).startOf('day');
        const timelineEnd = moment(endDate).endOf('day');
        const totalWidth = timeUnits.length * 210; // Общая ширина всех ячеек (210px на ячейку)

        // Вычисляем смещение от начала временной шкалы в днях
        const daysFromStart = moment(taskStart).diff(timelineStart, 'days');
        const taskDuration = moment(taskEnd).diff(taskStart, 'days') + 1; // +1 чтобы включить последний день
        
        // Переводим дни в пиксели (210px - ширина одной ячейки месяца)
        const daysInTimeline = moment(timelineEnd).diff(timelineStart, 'days');
        const pixelsPerDay = totalWidth / daysInTimeline;
        
        const left = Math.max(daysFromStart * pixelsPerDay, 0);
        const width = Math.max(taskDuration * pixelsPerDay, 30); // Минимальная ширина 30px

        return {
            left: `${left}px`,
            width: `${width}px`
        };
    };

    const getTaskColor = (priority) => {
        return priority === 'high' ? '#ff4d4f' :
               priority === 'medium' ? '#faad14' : '#52c41a';
    };

    const formatTimeUnit = (date) => {
        if (viewScale === 'month') {
            return date.format('MMMM YYYY');
        }
        return `${date.format('DD.MM')} - ${date.endOf('week').format('DD.MM')}`;
    };

    const displayData = resizingTask ? tempTimelineData : timelineData;

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsModalVisible(true);
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        setSelectedTask(null);
    };

    return (
        <div className="timeline-container">
            <div className="timeline-header">
                <h2>Хронология задач</h2>
                <div className="timeline-controls">
                    <Group value={viewScale} onChange={e => setViewScale(e.target.value)}>
                        <Button value="month">Месяцы</Button>
                        <Button value="week">Недели</Button>
                    </Group>
                    <RangePicker
                        value={[startDate, endDate]}
                        onChange={([start, end]) => {
                            if (start && end) {
                                setStartDate(start);
                                setEndDate(end);
                            }
                        }}
                        format="DD.MM.YYYY"
                    />
                </div>
            </div>
            <Spin spinning={loading}>
                <div className="gantt-container" ref={containerRef}>
                    <div className="gantt-header">
                        <div className="task-info-header">Задачи</div>
                        <div className="time-units-header">
                            {timeUnits.map((unit, index) => (
                                <div key={index} className="time-unit-cell">
                                    {formatTimeUnit(unit)}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="gantt-body">
                        {displayData.map(task => (
                            <div key={task.id} className="gantt-row">
                                <div className="task-info">
                                    <div 
                                        className="task-title"
                                        onClick={() => handleTaskClick(task)}
                                    >
                                        {task.title}
                                    </div>
                                    <div className="task-dates">
                                        <span className="task-date">{moment(task.created_at).format('DD.MM.YYYY')}</span>
                                        <span className="task-date-separator">→</span>
                                        <span className="task-date">{moment(task.due_date).format('DD.MM.YYYY')}</span>
                                    </div>
                                </div>
                                <div className="time-units-grid">
                                    <div className="task-bar-container" style={getTaskPosition(task)}>
                                        <div 
                                            className="task-duration-bar"
                                            style={{
                                                backgroundColor: getTaskColor(task.priority)
                                            }}
                                        />
                                        <div 
                                            className="task-resize-handle"
                                            onMouseDown={(e) => handleResizeStart(e, task)}
                                        />
                                    </div>
                                    {timeUnits.map((_, index) => (
                                        <div key={index} className="time-unit-cell-grid" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Spin>
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    visible={isModalVisible}
                    onCancel={handleModalClose}
                    onUpdate={onTaskUpdate}
                />
            )}
        </div>
    );
};
export default TaskTimeline; 
