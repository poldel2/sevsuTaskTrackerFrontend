import React, { useState, useEffect } from 'react';
import { List, Avatar, Typography, Space, Select, DatePicker, Card, Empty, Pagination } from 'antd';
import { FileOutlined, DeleteOutlined, EditOutlined, ProjectOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getActivities, getProjects, getTasks } from '../../services/api';
import TopMenu from '../layout/TopMenu';
import TaskModal from '../tasks/TaskModal';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const getActionIcon = (action) => {
  switch (action) {
    case 'CREATE': return <FileOutlined style={{ color: '#52c41a' }} />;
    case 'DELETE': return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
    case 'UPDATE': return <EditOutlined style={{ color: '#1890ff' }} />;
    default: return <FileOutlined />;
  }
};

const ActivitiesPage = () => {
  const [activities, setActivities] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    projectId: undefined,
    type: 'all',
    date: null,
    page: 1,
    pageSize: 10
  });
  const [total, setTotal] = useState(0);
  const [view, setView] = useState('timeline'); // timeline или byProject

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [filters.projectId, filters.type, filters.date, filters.page]);

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
      const response = await getActivities(filters.projectId, {
        ...filters,
        offset: (filters.page - 1) * filters.pageSize,
        limit: filters.pageSize
      });
      setActivities(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (projectId, taskId) => {
    try {
      const tasks = await getTasks(projectId);
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask({ ...task, project_id: projectId });
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error('Ошибка при загрузке задачи:', error);
    }
  };

  const formatActivityMessage = (activity) => {
    const message = activity.formatted_message || `${activity.action} ${activity.entity_type.toLowerCase()}`;
    if (activity.entity_type === 'TASK' && activity.changes) {
      const taskId = activity.entity_id;
      const taskTitle = activity.changes.new?.title || activity.changes.old?.title;
      if (taskTitle) {
        const titlePart = `'${taskTitle}'`;
        return message.split(titlePart).map((part, index, array) => {
          if (index === array.length - 1) return part;
          return (
            <>
              {part}
              <Text
                style={{ color: '#1890ff', cursor: 'pointer' }}
                onClick={() => handleTaskClick(activity.project_id, taskId)}
              >
                {taskTitle}
              </Text>
            </>
          );
        });
      }
    }
    return message;
  };

  const groupByProject = () => {
    return projects.map(project => ({
      project,
      activities: activities.filter(a => a.project_id === project.id)
    }));
  };

  const renderFilters = () => (
    <Space wrap style={{ marginBottom: 16 }}>
      <Select
        placeholder="Выберите проект"
        style={{ width: 200 }}
        allowClear
        value={filters.projectId}
        onChange={(value) => setFilters(prev => ({ ...prev, projectId: value, page: 1 }))}
      >
        {projects.map(project => (
          <Select.Option key={project.id} value={project.id}>
            {project.title}
          </Select.Option>
        ))}
      </Select>

      <Select
        value={filters.type}
        onChange={(value) => setFilters(prev => ({ ...prev, type: value, page: 1 }))}
        style={{ width: 200 }}
      >
        <Select.Option value="all">Все действия</Select.Option>
        <Select.Option value="CREATE">Создание</Select.Option>
        <Select.Option value="UPDATE">Обновление</Select.Option>
        <Select.Option value="DELETE">Удаление</Select.Option>
      </Select>
      
      <RangePicker
        onChange={(dates) => setFilters(prev => ({ ...prev, date: dates, page: 1 }))}
        value={filters.date}
      />

      <Select
        value={view}
        onChange={setView}
        style={{ width: 150 }}
      >
        <Select.Option value="timeline">Хронология</Select.Option>
        <Select.Option value="byProject">По проектам</Select.Option>
      </Select>
    </Space>
  );

  const renderTimeline = () => (
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
                <Text strong>
                  {activity.user ? `${activity.user.first_name} ${activity.user.last_name}` : 'Пользователь удален'}
                </Text>
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
            description={formatActivityMessage(activity)}
          />
        </List.Item>
      )}
    />
  );

  const renderByProject = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {groupByProject().map(({ project, activities }) => (
        <Card key={project.id} title={project.title} style={{ marginBottom: 16 }}>
          {activities.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={activities}
              renderItem={activity => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={getActionIcon(activity.action)} />}
                    title={
                      <Space>
                        <Text strong>
                          {activity.user ? `${activity.user.first_name} ${activity.user.last_name}` : 'Пользователь удален'}
                        </Text>
                        <Text type="secondary">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                            locale: ru
                          })}
                        </Text>
                      </Space>
                    }
                    description={formatActivityMessage(activity)}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Нет активности" />
          )}
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <TopMenu />
      <div style={{ padding: '24px' }}>
        <Title level={2}>История активности</Title>
        {renderFilters()}
        
        {view === 'timeline' ? renderTimeline() : renderByProject()}

        {view === 'timeline' && (
          <Pagination
            current={filters.page}
            pageSize={filters.pageSize}
            total={total}
            onChange={(page) => setFilters({ ...filters, page })}
            style={{ marginTop: 16, textAlign: 'right' }}
          />
        )}

        {selectedTask && (
          <TaskModal
            task={selectedTask}
            visible={isModalVisible}
            onCancel={() => {
              setIsModalVisible(false);
              setSelectedTask(null);
            }}
            onUpdate={() => {
              setIsModalVisible(false);
              setSelectedTask(null);
              fetchActivities();
            }}
          />
        )}
      </div>
    </>
  );
};

export default ActivitiesPage;