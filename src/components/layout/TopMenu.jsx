import "../../styles/topMenu.css";
import React, { useState } from "react";
import { BellOutlined, UserOutlined, TeamOutlined, HistoryOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Badge, Space } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext';
import ActivityModal from '../activities/ActivityModal';
import { getImageUrl } from '../../services/api';

const menuItems = [
    { key: "work", label: "Работа" },
    { key: "projects", label: "Проекты" },
    { key: "teams", label: "Команды", isDropdown: true },
    { key: "plans", label: "Планы" },
];

const TopMenu = () => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, handleNotificationAction } = useNotifications();
    const navigate = useNavigate();
    const { projectId } = useParams();
    const [activityModalVisible, setActivityModalVisible] = useState(false);
    const [notificationMenuVisible, setNotificationMenuVisible] = useState(false);

    const handleTeamsClick = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        navigate('/teams');
    };

    const teamMenu = (
        <Menu>
            <Menu.Item key="activity" onClick={() => navigate('/activities')}>
                Просмотр активности
            </Menu.Item>
        </Menu>
    );

    const notificationMenu = (
        <Menu>
            {notifications.length > 0 ? (
                notifications.map((notification) => (
                    <Menu.Item 
                        key={notification.id}
                        onClick={() => handleNotificationAction(notification)}
                        style={{ 
                            background: notification.read ? 'white' : '#f0f0f0',
                            maxWidth: '300px'
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 'bold' }}>{notification.title}</div>
                            <div>{notification.message}</div>
                        </div>
                    </Menu.Item>
                ))
            ) : (
                <Menu.Item disabled>Нет уведомлений</Menu.Item>
            )}
        </Menu>
    );

    const dropdownMenu = (
        <Menu>
            <Menu.Item key="profile" onClick={() => navigate('/profile')}>Профиль</Menu.Item>
            <Menu.Item key="settings">Настройки</Menu.Item>
            <Menu.Item key="logout" onClick={logout}>Выйти</Menu.Item>
        </Menu>
    );

    return (
        <header className="top-menu">
            <div className="logo">
                <img src="/assets/logo_blue.svg" alt="Logo" className="logo-img" />
            </div>

            <nav className="nav">
                {menuItems.map((item) => (
                    item.isDropdown ? (
                        <Dropdown key={item.key} overlay={teamMenu} trigger={['click']}>
                            <div className="nav-item">
                                {item.label}
                            </div>
                        </Dropdown>
                    ) : (
                        <div 
                            key={item.key} 
                            className="nav-item"
                            onClick={() => navigate(`/${item.key}`)}
                        >
                            {item.label}
                        </div>
                    )
                ))}
            </nav>

            <div className="user-section">
                <HistoryOutlined 
                    className="activity-icon" 
                    onClick={() => setActivityModalVisible(true)}
                    style={{ fontSize: '20px', marginRight: '24px', cursor: 'pointer' }}
                />

                <ActivityModal 
                    visible={activityModalVisible}
                    onClose={() => setActivityModalVisible(false)}
                />
                
                <Dropdown 
                    overlay={notificationMenu} 
                    trigger={["click"]} 
                    placement="bottomRight"
                    open={notificationMenuVisible}
                    onOpenChange={setNotificationMenuVisible}
                >
                    <Badge count={unreadCount} className="notification-badge">
                        <BellOutlined className="notification-icon" />
                    </Badge>
                </Dropdown>
                
                <Dropdown overlay={dropdownMenu} trigger={["click"]}>
                    <div className="user-avatar">
                        {user?.avatar ? (
                            <img 
                                src={getImageUrl(user.avatar)} 
                                alt="Avatar" 
                                className="header-user-avatar" 
                            />
                        ) : (
                            <div className="header-default-avatar">
                                <span>{user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </Dropdown>
            </div>
        </header>
    );
};

export default TopMenu;
