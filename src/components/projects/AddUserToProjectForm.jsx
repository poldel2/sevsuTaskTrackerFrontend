import React, { useState } from 'react';
import { addUserToProject } from '../services/api';

const AddUserToProjectForm = ({ projectId, onClose }) => {
    const [userId, setUserId] = useState('');
    const [role, setRole] = useState('member');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await addUserToProject(projectId, userId, role);
            setSuccess(`User ${userId} added to project ${projectId} with role ${role}`);
            setUserId('');
            setRole('member');
            setTimeout(onClose, 2000); // Закрываем форму через 2 секунды после успеха
        } catch (err) {
            setError(err.detail || 'Failed to add user');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Add User to Project</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>User ID:</label>
                        <input
                            type="number"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Role:</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="member">Member</option>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {success && <p style={{ color: 'green' }}>{success}</p>}
                    <button type="submit">Add User</button>
                    <button type="button" onClick={onClose}>Close</button>
                </form>
            </div>
            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 5px;
                    width: 400px;
                    max-width: 90%;
                }
                form div {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                }
                input, select {
                    width: 100%;
                    padding: 8px;
                    box-sizing: border-box;
                }
                button {
                    padding: 10px 15px;
                    margin-right: 10px;
                }
            `}</style>
        </div>
    );
};

export default AddUserToProjectForm;