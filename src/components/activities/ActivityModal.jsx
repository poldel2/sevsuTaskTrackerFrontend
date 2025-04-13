import React, { useState, useEffect } from 'react';
import { Modal, List, Avatar, Typography, Space, Select, DatePicker, Empty } from 'antd';
import { FileOutlined, DeleteOutlined, EditOutlined, ProjectOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
// import { getAllActivities, getProjects } from '../../services/api';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const getActionIcon = (action) => {
  switch (action) {
    case 'CREATE': return <FileOutlined style={{ color: '#52c41a' }} />;
    case 'DELETE': return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
    case 'UPDATE': return <EditOutlined style={{ color: '#1890ff' }} />;
    default: return <FileOutlined />;
  }
};

const ActivityModal = ({ visible, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    projectId: undefined,
    type: 'all',
    date: null
  });

  useEffect(() => {
    if (visible) {
      fetchProjects();
      fetchActivities();
    }
  }, [visible, filters]);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await getAllActivities(filters);
      setActivities(data.items || data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFilters = () => (
    <Space wrap style={{ marginBottom: 16 }}>
      <Select
        placeholder="Выберите проект"
        style={{ width: 200 }}
        allowClear
        value={filters.projectId}
        onChange={(value) => setFilters({ ...filters, projectId: value })}
      >
        {projects.map(project => (
          <Select.Option key={project.id} value={project.id}>
            {project.title}
          </Select.Option>
        ))}
      </Select>

      <Select
        value={filters.type}
        onChange={(value) => setFilters({ ...filters, type: value })}
        style={{ width: 200 }}
      >
        <Select.Option value="all">Все действия</Select.Option>
        <Select.Option value="CREATE">Создание</Select.Option>
        <Select.Option value="UPDATE">Обновление</Select.Option>
        <Select.Option value="DELETE">Удаление</Select.Option>
      </Select>
      
      <RangePicker
        onChange={(dates) => setFilters({ ...filters, date: dates })}
      />
    </Space>
  );

  return (
    <Modal
      title="История активности"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      {renderFilters()}
      
      <List
        loading={loading}
        itemLayout="horizontal"
        dataSource={activities}
        locale={{ emptyText: <Empty description="Нет данных" /> }}
        renderItem={activity => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar icon={getActionIcon(activity.action)} />}
              title={
                <Space>
                  <Text strong>{activity.user?.email}</Text>
                  <Text type="secondary">
                    {formatDistanceToNow(new Date(activity.created_at), { 
                      addSuffix: true,
                      locale: ru 
                    })}
                  </Text>
                  {activity.project_title && (
                    <Text type="secondary">
                      <ProjectOutlined /> {activity.project_title}
                    </Text>
                  )}
                </Space>
              }
              description={`${activity.action} ${activity.entity_type.toLowerCase()}`}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default ActivityModal;