import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/ProjectSettings.css';
import ColumnSettings from '../common/ColumnSettings';
import ProjectDetails from './ProjectDetails';
import ProjectUsers from './ProjectUsers';

const ProjectSettings = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('details'); // По умолчанию открываем "Сведения"

    const sections = [
        { id: 'details', name: 'Сведения', component: <ProjectDetails projectId={projectId} /> },
        { id: 'users', name: 'Пользователи', component: <ProjectUsers projectId={projectId} /> },
        { id: 'columns', name: 'Столбцы', component: <ColumnSettings projectId={projectId} /> },
    ];

    const renderContent = () => {
        const section = sections.find(s => s.id === activeSection);
        return section ? section.component : null;
    };

    return (
        <div className="project-settings">
            <div className="settings-sidebar">
                <h3>Настройки проекта</h3>
                <ul>
                    {sections.map(section => (
                        <li
                            key={section.id}
                            className={activeSection === section.id ? 'active' : ''}
                            onClick={() => setActiveSection(section.id)}
                        >
                            {section.name}
                        </li>
                    ))}
                </ul>
                <button onClick={() => navigate('/projects')} className="back-button">
                    Назад к проектам
                </button>
            </div>
            <div className="settings-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default ProjectSettings;