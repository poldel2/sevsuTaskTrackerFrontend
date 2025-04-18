import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/TaskCalendar.css';
import CustomToolbar from './CustomToolBar';
import TaskModal from './TaskModal';

moment.updateLocale('ru', {
    months: [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ],
    monthsShort: [
        'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
        'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ],
    weekdays: [
        'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
        'Четверг', 'Пятница', 'Суббота'
    ],
    weekdaysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    weekdaysMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    week: {
        dow: 1,
        doy: 4 
    }
});

const localizer = momentLocalizer(moment);

const messages = {
    allDay: 'Весь день',
    previous: 'Назад',
    next: 'Вперед',
    today: 'Сегодня',
    month: 'Месяц',
    week: 'Неделя',
    day: 'День',
    agenda: 'Повестка',
    date: 'Дата',
    time: 'Время',
    event: 'Событие',
    noEventsInRange: 'Нет событий в этом диапазоне',
    showMore: total => `+ ${total} событий`,
};

const formats = {
    monthHeaderFormat: (date) => 
        moment(date).format('MMMM YYYY'),
    weekdayFormat: (date) => 
        moment(date).format('dddd'),
    dayFormat: (date) =>
        moment(date).format('DD'),
    dayHeaderFormat: (date) =>
        moment(date).format('D MMMM'),
    dayRangeHeaderFormat: ({ start, end }) =>
        `${moment(start).format('D MMMM')} - ${moment(end).format('D MMMM')}`,
    timeGutterFormat: (date) =>
        moment(date).format('HH:mm'),
    eventTimeRangeFormat: ({ start, end }) =>
        `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
};

const TaskCalendar = ({ tasks, onUpdate }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

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
            return event;
        });

    const eventStyleGetter = (event) => {
        const style = {

        };
        return { style };
    };

    const handleSelectEvent = (event) => {
        setSelectedTask({ ...event.resource, project_id: event.resource.project_id });
        setIsModalVisible(true);
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        setSelectedTask(null);
    };

    const handleTaskUpdate = () => {
        handleModalClose();
        if (onUpdate) {
            onUpdate();
        }
    };

    const components = {
        toolbar: CustomToolbar,
    };

    return (
        <div className="task-calendar-container">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 650 }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                defaultView="month"
                views={['month', 'week', 'day']}
                step={60}
                timeslots={1}
                components={components}
                messages={messages}
                formats={formats}
            />
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    visible={isModalVisible}
                    onCancel={handleModalClose}
                    onUpdate={handleTaskUpdate}
                />
            )}
        </div>
    );
};

export default TaskCalendar;