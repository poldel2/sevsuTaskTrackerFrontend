import React, { useState, useEffect } from 'react';
import { getProjectUsers, searchUsers, addUserToProject } from '../services/api';
import { Input, Button, Select, message, Spin } from 'antd';
import '../styles/ProjectSettings.css';

const { Option } = Select;

const ProjectUsers = ({ projectId }) => {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            return;
        }
        try {
            setLoading(true);
            const results = await searchUsers(value);
            // Фильтруем, чтобы исключить уже добавленных пользователей
            const filteredResults = results.filter(
                result => !users.some(user => user.user_id === result.id)
            );
            setSearchResults(filteredResults);
        } catch (err) {
            setError('Ошибка поиска пользователей');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!selectedUserId) {
            setError('Выберите пользователя для добавления');
            return;
        }
        try {
            setLoading(true);
            const addedUser = await addUserToProject(projectId, selectedUserId);
            setUsers([...users, addedUser]);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUserId(null);
            setError('');
            message.success('Пользователь успешно добавлен');
        } catch (err) {
            setError('Не удалось добавить пользователя');
        } finally {
            setLoading(false);
        }
    };

    if (loading && users.length === 0) {
        return <Spin tip="Загрузка..." />;
    }

    return (
        <div className="project-users">
            <h2>Пользователи проекта</h2>
            {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
            <div className="users-list">
                {users.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {users.map(user => (
                            <li key={user.user_id} className="user-item">
                                {user.first_name} {user.last_name} ({user.role})
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Пользователи пока не добавлены</p>
                )}
            </div>
            <div className="add-user-form" style={{ marginTop: '20px' }}>
                <h3>Добавить пользователя</h3>
                <Input
                    placeholder="Введите имя или фамилию"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: '300px', marginBottom: '10px' }}
                />
                {searchResults.length > 0 && (
                    <Select
                        placeholder="Выберите пользователя"
                        value={selectedUserId}
                        onChange={(value) => setSelectedUserId(value)}
                        style={{ width: '300px', marginBottom: '10px' }}
                        showSearch={false}
                    >
                        {searchResults.map(user => (
                            <Option key={user.id} value={user.id}>
                                {user.first_name} {user.last_name} ({user.email})
                            </Option>
                        ))}
                    </Select>
                )}
                <Button
                    type="primary"
                    onClick={handleAddUser}
                    disabled={!selectedUserId || loading}
                    loading={loading}
                >
                    Добавить
                </Button>
            </div>
        </div>
    );
};

export default ProjectUsers;