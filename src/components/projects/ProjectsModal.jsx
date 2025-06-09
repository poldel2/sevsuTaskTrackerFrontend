import React, { useState } from 'react';
import { Modal, Form, Input, Button, Checkbox, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import ImageCropper from '../common/ImageCropper';
import { addProject, uploadProjectLogo } from '../../services/api';
import styled from 'styled-components';

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .ant-modal-header {
    border-radius: 12px 12px 0 0;
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
  }

  .ant-modal-title {
    font-size: 18px;
    color: #333;
  }

  .ant-modal-body {
    padding: 24px;
  }

  .ant-form-item-label > label {
    color: #666;
  }

  .ant-input, .ant-input-textarea {
    border-radius: 8px;
    &:focus, &:hover {
      border-color: #5C7BBB;
    }
  }

  .ant-btn {
    border-radius: 8px;
    height: 40px;
    &.ant-btn-primary {
      background: #5C7BBB;
      border-color: #5C7BBB;
      &:hover {
        background: #4a69a8;
        border-color: #4a69a8;
      }
    }
  }

  .logo-upload-btn {
    width: 100%;
    border: 1px dashed #d9d9d9;
    &:hover {
      border-color: #5C7BBB;
      color: #5C7BBB;
    }
  }

  .logo-preview {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-preview img {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    object-fit: cover;
  }

  .logo-preview-text {
    color: #5C7BBB;
    font-size: 14px;
  }
`;

const ProjectsModal = ({ isVisible, onClose, onSuccess, isEdit = false }) => {
    const [form] = Form.useForm();
    const [cropFile, setCropFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const projectData = {
                title: values.name,
                description: values.description,
                is_private: values.isPrivate ? 1 : 0,
                start_date: new Date().toISOString(),
                end_date: new Date().toISOString(),
            };
            
            const addedProject = await addProject(projectData);
            
            if (cropFile) {
                const file = new File([cropFile], 'logo.jpg', { type: 'image/jpeg' });
                await uploadProjectLogo(addedProject.id, file);
            }

            message.success("Проект успешно создан");
            form.resetFields();
            setCropFile(null);
            setLogoPreview(null);
            onSuccess(addedProject);
            onClose();
        } catch (error) {
            console.error(error);
            message.error("Ошибка при создании проекта");
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCropFile(file);
    };

    const handleCropComplete = (blob) => {
        setCropFile(blob);
        const previewUrl = URL.createObjectURL(blob);
        setLogoPreview(previewUrl);
    };

    return (
        <>
            <StyledModal
                title="Создать проект"
                open={isVisible}
                onOk={handleSubmit}
                onCancel={onClose}
                okText="Создать"
                cancelText="Отмена"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Название проекта"
                        name="name"
                        rules={[{ required: true, message: "Введите название проекта" }]}
                    >
                        <Input placeholder="Введите название проекта" />
                    </Form.Item>
                    <Form.Item
                        label="Описание"
                        name="description"
                        rules={[{ required: true, message: "Введите описание проекта" }]}
                    >
                        <Input.TextArea 
                            placeholder="Введите описание проекта" 
                            rows={4}
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>
                    <Form.Item
                        label="Логотип проекта"
                        name="logo"
                    >
                        <Button 
                            className="logo-upload-btn"
                            icon={<EditOutlined />} 
                            onClick={() => document.getElementById('project-logo-upload').click()}
                        >
                            Выбрать логотип проекта
                        </Button>
                        <input
                            id="project-logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            style={{ display: 'none' }}
                        />
                        {logoPreview && (
                            <div className="logo-preview">
                                <img src={logoPreview} alt="Превью логотипа" />
                                <span className="logo-preview-text">Логотип загружен</span>
                            </div>
                        )}
                    </Form.Item>
                    <Form.Item
                        name="isPrivate"
                        valuePropName="checked"
                    >
                        <Checkbox>Приватный проект</Checkbox>
                    </Form.Item>
                </Form>
            </StyledModal>

            {cropFile && !logoPreview && (
                <ImageCropper
                    file={cropFile}
                    aspect={1}
                    targetWidth={150}
                    targetHeight={150}
                    title="Логотип проекта"
                    imageLabel="логотипа проекта"
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setCropFile(null);
                        setLogoPreview(null);
                    }}
                />
            )}
        </>
    );
};

export default ProjectsModal;