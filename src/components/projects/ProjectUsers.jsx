import React, { useState, useEffect } from 'react';
import { getProjectUsers, searchUsers, addUserToProject } from '../../services/api';
import { Input, Button, Table, message, Spin } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import '../../styles/ProjectSettings.css';
import {getDefaultUserRole} from "../../config/project-user-config.js";

const ProjectUsers = ({ projectId }) => {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const columns = [
        {
            title: 'Имя',
            dataIndex: 'first_name',
            key: 'first_name',
        },
        {
            title: 'Фамилия',
            dataIndex: 'last_name',
            key: 'last_name',
        },
        {
            title: 'Отчество',
            dataIndex: 'middle_name',
            key: 'middle_name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Роль',
            dataIndex: 'role',
            key: 'role',
        }
    ];

    useEffect(() => {
        fetchProjectUsers();
    }, [projectId]);

    const fetchProjectUsers = async () => {
        try {
            setLoading(true);
            const data = await getProjectUsers(projectId);
            setUsers(data);
        } catch (err) {
            setError('Не удалось загрузить пользователей проекта');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (value) => {
        setSearchQuery(value);
        if (value.trim().length < 2) {
            setSearchResults([]);
            setSelectedUser(null);
            return;
        }
        try {
            setLoading(true);
            const results = await searchUsers(value);
            const filteredResults = results.filter(
                result => !users.some(user => user.user_id === result.id)
            );
            setSearchResults(filteredResults);
            if (filteredResults.length > 0) {
                setSelectedUser(filteredResults[0]);
            }
        } catch (err) {
            setError('Ошибка поиска пользователей');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!selectedUser) return;
        
        try {
            let role = getDefaultUserRole();
            setLoading(true);
            const addedUser = await addUserToProject(projectId, selectedUser.id, role);
            setUsers([...users, addedUser]);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUser(null);
            setError('');
            message.success('Пользователь успешно добавлен');
        } catch (err) {
            setError('Не удалось добавить пользователя');
        } finally {
            setLoading(false);
        }
    };

    if (loading && users.length === 0) {
        return <div className="project-users-loading"><Spin /></div>;
    }

    return (
        <div className="project-users">
            <div className="project-users-header">
                <h3>Пользователи</h3>
                <div className="search-section">
                    <div className="search-container">
                        <Input
                            placeholder="Поиск пользователя"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            suffix={<SearchOutlined style={{ color: 'rgba(0,0,0,.45)' }} />}
                            className="search-input"
                        />
                        {searchResults.length > 0 && searchQuery && (
                            <div className="search-results">
                                {searchResults.map(user => (
                                    <div
                                        key={user.id}
                                        className={`search-result-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <div className="user-info">
                                            <div className="user-name">
                                                {user.first_name} {user.last_name}
                                            </div>
                                            <div className="user-email">{user.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddUser}
                        disabled={!selectedUser}
                        className="add-user-button"
                    >
                        Добавить
                    </Button>
                </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <Table 
                columns={columns}
                dataSource={users}
                rowKey="user_id"
                pagination={false}
                className="users-table"
            />
        </div>
    );
};

export default ProjectUsers;