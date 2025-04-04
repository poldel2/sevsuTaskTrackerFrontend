import React, { useState, useEffect, useRef } from 'react';
import { DatePicker, Spin, message, Radio, ConfigProvider } from 'antd';
import moment from 'moment';
import 'moment/locale/ru';
import locale from 'antd/es/locale/ru_RU';
import { updateTask } from '../../services/api';
import '../../styles/Timeline.css';
import TaskModal from './TaskModal';

// Принудительно устанавливаем русскую локаль для moment
moment.locale('ru');

const { RangePicker } = DatePicker;
const { Button, Group } = Radio;

const TaskTimeline = ({ tasks, onTaskUpdate, projectId }) => {
    const [loading, setLoading] = useState(false);
    const [timelineData, setTimelineData] = useState([]);
    const [startDate, setStartDate] = useState(moment().subtract(6, 'months').startOf('month'));
    const [endDate, setEndDate] = useState(moment().add(6, 'months').endOf('month'));
    const [timeUnits, setTimeUnits] = useState([]);
    const [viewScale, setViewScale] = useState('month');
    const [resizingTask, setResizingTask] = useState(null);
    const [resizeStartX, setResizeStartX] = useState(0);
    const [initialDate, setInitialDate] = useState(null);
    const [tempTimelineData, setTempTimelineData] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const containerRef = useRef(null);
    const ganttBodyRef = useRef(null);
    const timeUnitsHeaderRef = useRef(null);
    const [resizeType, setResizeType] = useState(null); 

    useEffect(() => {
        moment.locale('ru');
    }, []);

    useEffect(() => {
        if (tasks) {
            const sortedTasks = [...tasks].sort((a, b) => {
                const aDate = a.start_date || a.created_at;
                const bDate = b.start_date || b.created_at;
                return moment(aDate).valueOf() - moment(bDate).valueOf();
            });

            const timelineItems = sortedTasks.map(task => ({
                ...task,
                startDate: moment(task.start_date || task.created_at).clone(),
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

    useEffect(() => {
        const syncScroll = (e) => {
            if (timeUnitsHeaderRef.current) {
                timeUnitsHeaderRef.current.scrollLeft = e.target.scrollLeft;
            }
        };

        const ganttBody = ganttBodyRef.current;
        if (ganttBody) {
            ganttBody.addEventListener('scroll', syncScroll);
        }

        return () => {
            if (ganttBody) {
                ganttBody.removeEventListener('scroll', syncScroll);
            }
        };
    }, []);

    useEffect(() => {
        if (timeUnits.length > 0 && ganttBodyRef.current) {
            const today = moment();
            const timelineStart = moment(startDate);
            const timelineEnd = moment(endDate);
            const totalWidth = timeUnits.length * 210;
            const daysInTimeline = timelineEnd.diff(timelineStart, 'days');
            const pixelsPerDay = totalWidth / daysInTimeline;
            
            const daysSinceStart = today.diff(timelineStart, 'days');
            const scrollPosition = daysSinceStart * pixelsPerDay - (ganttBodyRef.current.clientWidth / 2);
            
            ganttBodyRef.current.scrollLeft = Math.max(0, scrollPosition);
            if (timeUnitsHeaderRef.current) {
                timeUnitsHeaderRef.current.scrollLeft = Math.max(0, scrollPosition);
            }
        }
    }, [timeUnits, startDate, endDate]);

    const handleDateChange = async (taskId, updateData) => {
        if (!updateData || !projectId) return;
        
        try {
            setLoading(true);
            const task = timelineData.find(t => t.id === taskId);
            if (!task) return;

            // Обновляем задачу на сервере
            const serverResponse = await updateTask(taskId, projectId, updateData);
            
            // Локально обновляем данные без вызова onTaskUpdate
            const updatedTask = {
                ...task,
                ...updateData,
                startDate: updateData.start_date 
                    ? moment(updateData.start_date).clone() 
                    : task.startDate,
                endDate: updateData.due_date 
                    ? moment(updateData.due_date).clone() 
                    : task.endDate,
                start_date: updateData.start_date || task.start_date,
                due_date: updateData.due_date || task.due_date
            };
            
            setTimelineData(prevData => 
                prevData.map(t => t.id === taskId ? updatedTask : t)
            );
            
            setTempTimelineData(prevData => 
                prevData.map(t => t.id === taskId ? updatedTask : t)
            );
            
            // Передаем обновленные данные задачи в родительский компонент
            if (onTaskUpdate && serverResponse) {
                onTaskUpdate(serverResponse);
            }
            
            const messageText = updateData.start_date 
                ? 'Дата начала задачи обновлена' 
                : 'Срок выполнения задачи обновлен';
            message.success(messageText);
        } catch (error) {
            console.error('Error updating task:', error);
            const errorText = updateData.start_date 
                ? 'Не удалось обновить дату начала' 
                : 'Не удалось обновить срок выполнения';
            message.error(errorText);
        } finally {
            setLoading(false);
        }
    };

    const handleResizeStart = (e, task, type) => {
        e.stopPropagation();
        setResizingTask(task);
        setResizeStartX(e.clientX);
        setResizeType(type);
        
        if (type === 'start') {
            setInitialDate(moment(task.start_date || task.created_at).clone());
        } else {
            setInitialDate(moment(task.due_date).clone());
        }
    };

    const handleResizeMove = (e) => {
        if (!resizingTask || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - resizeStartX;
        const containerWidth = containerRect.width;
        const daysPerPixel = moment(endDate).diff(startDate, 'days') / containerWidth;
        const daysDelta = Math.round(deltaX * daysPerPixel);

        const newDate = moment(initialDate).clone().add(daysDelta, 'days');
        
        try {
            setTempTimelineData(prevData => 
                prevData.map(task => {
                    if (task.id === resizingTask.id) {
                        if (resizeType === 'start') {
                            // Проверяем, что новая дата начала не позже даты завершения
                            if (newDate.isBefore(moment(task.due_date))) {
                                return {
                                    ...task,
                                    startDate: newDate.clone(),
                                    start_date: newDate.format('YYYY-MM-DD')
                                };
                            }
                        } else {
                            // Проверяем, что новая дата завершения не раньше даты начала
                            const taskStartDate = moment(task.start_date || task.created_at);
                            if (newDate.isAfter(taskStartDate)) {
                                return {
                                    ...task,
                                    endDate: newDate.clone(),
                                    due_date: newDate.format('YYYY-MM-DD')
                                };
                            }
                        }
                    }
                    return task;
                })
            );
        } catch (error) {
            console.error('Error updating tempTimelineData:', error);
        }
    };

    const handleResizeEnd = async (e) => {
        try {
            if (resizingTask) {
                const updatedTask = tempTimelineData.find(t => t.id === resizingTask.id);
                
                if (updatedTask) {
                    // Получаем финальную позицию перед отпусканием
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const deltaX = e.clientX - resizeStartX;
                    const containerWidth = containerRect.width;
                    const daysPerPixel = moment(endDate).diff(startDate, 'days') / containerWidth;
                    const daysDelta = Math.round(deltaX * daysPerPixel);
                    
                    if (resizeType === 'start') {
                        const newDate = moment(initialDate).clone().add(daysDelta, 'days');
                        if (newDate.isBefore(moment(resizingTask.due_date))) {
                            await handleDateChange(resizingTask.id, {
                                start_date: newDate.format('YYYY-MM-DD')
                            });
                        }
                    } else {
                        const newDate = moment(initialDate).clone().add(daysDelta, 'days');
                        const taskStartDate = moment(resizingTask.start_date || resizingTask.created_at);
                        if (newDate.isAfter(taskStartDate)) {
                            await handleDateChange(resizingTask.id, {
                                due_date: newDate.format('YYYY-MM-DD')
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in handleResizeEnd:', error);
        } finally {
            setResizingTask(null);
            setResizeStartX(0);
            setInitialDate(null);
            setResizeType(null);
        }
    };
    
    // Отдельные функции для привязки обработчиков событий
    const handleMouseMove = (e) => handleResizeMove(e);
    const handleMouseUp = (e) => handleResizeEnd(e);

    useEffect(() => {
        if (resizingTask) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [resizingTask, resizeType]);

    const getTaskPosition = (task) => {
        const taskStart = moment(task.start_date || task.created_at).startOf('day');
        const taskEnd = moment(task.due_date).endOf('day');
        const timelineStart = moment(startDate).startOf('day');
        const timelineEnd = moment(endDate).endOf('day');
        const totalWidth = timeUnits.length * 210;

        const daysFromStart = moment(taskStart).diff(timelineStart, 'days');
        const taskDuration = moment(taskEnd).diff(taskStart, 'days') + 1;
        
        const daysInTimeline = moment(timelineEnd).diff(timelineStart, 'days');
        const pixelsPerDay = totalWidth / daysInTimeline;
        
        const left = Math.max(daysFromStart * pixelsPerDay, 0);
        const width = Math.max(taskDuration * pixelsPerDay, 30);

        return {
            left: `${left}px`,
            width: `${width}px`
        };
    };

    const getTodayPosition = () => {
        const today = moment();
        const timelineStart = moment(startDate).startOf('day');
        const timelineEnd = moment(endDate).endOf('day');
        const totalWidth = timeUnits.length * 210;
        
        if (today.isBefore(timelineStart) || today.isAfter(timelineEnd)) {
            return { display: 'none' };
        }
        
        const daysFromStart = today.diff(timelineStart, 'days');
        const daysInTimeline = timelineEnd.diff(timelineStart, 'days');
        const pixelsPerDay = totalWidth / daysInTimeline;
        
        return {
            left: `${daysFromStart * pixelsPerDay}px`,
            display: 'block'
        };
    };

    const getTaskColor = (priority) => {
        return priority === 'high' ? '#ff4d4f' :
               priority === 'medium' ? '#faad14' : '#52c41a';
    };

    const formatTimeUnit = (date) => {
        if (viewScale === 'month') {
            // Ручное форматирование месяцев на русском
            const monthsRu = [
                'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
            ];
            return `${monthsRu[date.month()]} ${date.year()}`;
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
        <ConfigProvider locale={locale}>
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
                            <div className="time-units-header" ref={timeUnitsHeaderRef}>
                                {timeUnits.map((unit, index) => (
                                    <div key={index} className="time-unit-cell">
                                        {formatTimeUnit(unit)}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="gantt-body" ref={ganttBodyRef}>
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
                                            <span className="task-date">{moment(task.start_date || task.created_at).format('DD.MM.YYYY')}</span>
                                            <span className="task-date-separator">→</span>
                                            <span className="task-date">{moment(task.due_date).format('DD.MM.YYYY')}</span>
                                        </div>
                                    </div>
                                    <div className="time-units-grid">
                                        <div className="today-indicator" style={getTodayPosition()}></div>
                                        <div className="task-bar-container" style={getTaskPosition(task)}>
                                            <div 
                                                className="task-resize-handle-left"
                                                onMouseDown={(e) => handleResizeStart(e, task, 'start')}
                                            />
                                            <div 
                                                className="task-duration-bar"
                                                style={{
                                                    backgroundColor: getTaskColor(task.priority)
                                                }}
                                            />
                                            <div 
                                                className="task-resize-handle"
                                                onMouseDown={(e) => handleResizeStart(e, task, 'end')}
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
        </ConfigProvider>
    );
};
export default TaskTimeline; 
