import React, { useState, useEffect } from 'react';
import { DatePicker, Spin, message } from 'antd';
import moment from 'moment';
import 'moment/locale/ru';
import { updateTask } from '../services/api';
import '../styles/Timeline.css';

const TaskTimeline = ({ tasks, onTaskUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [timelineData, setTimelineData] = useState([]);
    const [startDate, setStartDate] = useState(moment().startOf('month'));
    const [endDate, setEndDate] = useState(moment().endOf('month').add(2, 'months'));
    const [months, setMonths] = useState([]);

    useEffect(() => {
        if (tasks) {
            const sortedTasks = [...tasks].sort((a, b) => 
                moment(a.due_date).valueOf() - moment(b.due_date).valueOf()
            );

            const timelineItems = sortedTasks.map(task => ({
                ...task,
                startDate: moment(task.created_at),
                endDate: moment(task.due_date)
            }));

            setTimelineData(timelineItems);
        }
    }, [tasks]);

    useEffect(() => {
        const monthsArray = [];
        let currentDate = moment(startDate);
        
        while (currentDate.isSameOrBefore(endDate, 'month')) {
            monthsArray.push(moment(currentDate));
            currentDate.add(1, 'month');
        }
        
        setMonths(monthsArray);
    }, [startDate, endDate]);

    const handleDateChange = async (taskId, newDate) => {
        try {
            setLoading(true);
            await updateTask(taskId, {
                due_date: newDate.format('YYYY-MM-DD')
            });
            
            if (onTaskUpdate) {
                onTaskUpdate();
            }
            
            message.success('Срок выполнения задачи обновлен');
        } catch (error) {
            message.error('Не удалось обновить срок выполнения');
        } finally {
            setLoading(false);
        }
    };

    const getTaskPosition = (task) => {
        const taskStart = moment(task.created_at);
        const taskEnd = moment(task.due_date);
        const totalDays = moment(endDate).diff(startDate, 'days');
        const taskStartDays = moment(taskStart).diff(startDate, 'days');
        const taskDuration = moment(taskEnd).diff(taskStart, 'days');

        const left = Math.max((taskStartDays / totalDays) * 100, 0);
        const width = Math.min((taskDuration / totalDays) * 100, 100 - left);

        return {
            left: `${left}%`,
            width: `${width}%`
        };
    };

    const getTaskColor = (priority) => {
        return priority === 'high' ? '#ff4d4f' :
               priority === 'medium' ? '#faad14' : '#52c41a';
    };

    return (
        <div className="timeline-container">
            <div className="timeline-header">
                <h2>Хронология задач</h2>
                <div className="timeline-filters">
                    <DatePicker.RangePicker
                        value={[startDate, endDate]}
                        onChange={([start, end]) => {
                            setStartDate(start);
                            setEndDate(end);
                        }}
                        format="DD.MM.YYYY"
                    />
                </div>
            </div>
            <Spin spinning={loading}>
                <div className="gantt-container">
                    <div className="gantt-header">
                        <div className="task-info-header">Задачи</div>
                        <div className="months-header">
                            {months.map((month, index) => (
                                <div key={index} className="month-cell">
                                    {month.format('MMMM YYYY')}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="gantt-body">
                        {timelineData.map(task => (
                            <div key={task.id} className="gantt-row">
                                <div className="task-info">
                                    <div className="task-title">{task.title}</div>
                                    <div className="task-dates">
                                        <span>{moment(task.created_at).format('DD.MM.YYYY')}</span>
                                        <DatePicker
                                            value={moment(task.due_date)}
                                            onChange={(date) => handleDateChange(task.id, date)}
                                            format="DD.MM.YYYY"
                                            className="due-date-picker"
                                        />
                                    </div>
                                </div>
                                <div className="months-grid">
                                    <div 
                                        className="task-duration-bar"
                                        style={{
                                            ...getTaskPosition(task),
                                            backgroundColor: getTaskColor(task.priority)
                                        }}
                                    />
                                    {months.map((_, index) => (
                                        <div key={index} className="month-cell-grid" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Spin>
        </div>
    );
};

export default TaskTimeline; 