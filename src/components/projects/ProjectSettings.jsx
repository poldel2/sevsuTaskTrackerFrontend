import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import '../../styles/ProjectSettings.css';
import ColumnSettings from '../common/ColumnSettings';
import ProjectDetails from './ProjectDetails';
import ProjectUsers from './ProjectUsers';

const ProjectSettings = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('details');

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
            <button 
                onClick={() => navigate('/projects')} 
                className="back-arrow-button"
                style={{
                    position: 'absolute',
                    left: '20px',
                    top: '20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#5C7BBB',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'background-color 0.3s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f2f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <ArrowLeftOutlined />
            </button>

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
            </div>
            <div className="settings-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default ProjectSettings;