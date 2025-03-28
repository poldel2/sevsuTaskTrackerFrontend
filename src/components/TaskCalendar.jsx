import React from 'react';
import {Calendar, momentLocalizer} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/TaskCalendar.css';

const localizer = momentLocalizer(moment);

const TaskCalendar = ({ tasks }) => {

    const events = tasks
        .filter(task => {
            return !!task.due_date;
        })
        .map(task => {
            const event = {
                id: task.id,
                title: task.title,
                start: new Date(task.due_date),
                end: new Date(task.due_date),
                allDay: true,
                resource: task,
            };
            console.log('Созданное событие:', event); // Лог каждого события
            return event;
        });

    console.log('Итоговые события:', events); // Лог всех событий

    const eventStyleGetter = (event) => {
        const style = {
            backgroundColor: '#3174ad',
            borderRadius: '5px',
            opacity: 0.8,
            color: 'white',
            border: 'none',
            display: 'block',
        };
        return { style };
    };

    const handleSelectEvent = (event) => {
        alert(`Задача: ${event.title}\nДедлайн: ${moment(event.start).format('YYYY-MM-DD')}\nИсполнитель: ${event.resource.assignee_name || 'Не назначен'}`);
    };

    return (
        <div className="task-calendar-container">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                defaultView="month"
                views={['month', 'week', 'day']}
                step={60}
                timeslots={1}
            />
        </div>
    );
};

export default TaskCalendar;