import React, { useState } from 'react';
import { Input, Button, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import TopMenu from '../layout/TopMenu';
import { updateProfile, uploadAvatar, getImageUrl } from '../../services/api';
import ImageCropper from '../common/ImageCropper';
import '../../styles/UserProfile.css';

const UserProfile = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        avatar: user?.avatar || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cropFile, setCropFile] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const updatedUser = await updateProfile(formData);
            updateUser(updatedUser);
            message.success('Профиль успешно обновлен');
        } catch (err) {
            setError('Не удалось обновить профиль');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCropFile(file);
    };

    const handleCropComplete = async (croppedBlob) => {
        try {
            setLoading(true);
            const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
            const updatedUser = await uploadAvatar(file);
            updateUser(updatedUser);
            setFormData(prev => ({
                ...prev,
                avatar: updatedUser.avatar
            }));
            message.success('Аватар успешно обновлен');
        } catch (err) {
            setError('Не удалось загрузить аватар');
        } finally {
            setLoading(false);
            setCropFile(null);
        }
    };

    return (
        <>
            <TopMenu />
            <div className="user-profile">
                <h2>Настройки профиля</h2>
                <div className="profile-content">
                    <div className="avatar-section">
                        <div className="avatar-container">
                            {formData.avatar ? (
                                <img src={getImageUrl(formData.avatar)} alt="Аватар пользователя" className="user-avatar" />
                            ) : (
                                <div className="default-avatar">
                                    <span className="avatar-letter">{formData.first_name?.[0]?.toUpperCase() || "?"}</span>
                                </div>
                            )}
                            <label className="avatar-upload-button" htmlFor="avatar-upload">
                                <EditOutlined />
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="profile-form">
                        <div className="form-field">
                            <div className="field-label">Имя</div>
                            <Input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                placeholder="Введите имя"
                            />
                        </div>

                        <div className="form-field">
                            <div className="field-label">Фамилия</div>
                            <Input
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                placeholder="Введите фамилию"
                            />
                        </div>

                        <div className="form-field">
                            <div className="field-label">Email</div>
                            <Input
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Введите email"
                                disabled
                            />
                        </div>

                        <Button
                            type="primary"
                            onClick={handleSave}
                            loading={loading}
                            className="save-button"
                        >
                            Сохранить изменения
                        </Button>
                        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                    </div>
                </div>

                {cropFile && (
                    <ImageCropper
                        file={cropFile}
                        aspect={1}
                        targetWidth={150}
                        targetHeight={150}
                        title="Аватар профиля"
                        imageLabel="аватара"
                        onCropComplete={handleCropComplete}
                        onCancel={() => setCropFile(null)}
                    />
                )}
            </div>
        </>
    );
};

export default UserProfile;