import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from './AuthContext';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead as markAllRead,
  deleteNotification as deleteNotif,
  fetchTaskDetails
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import TaskModal from '../components/tasks/TaskModal';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await deleteNotif(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => 
        notifications.find(n => n.id === notificationId && !n.read) ? prev - 1 : prev
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  const handleNotificationAction = useCallback(async (notification) => {
    try {
      const { type, notification_metadata: metadata } = notification;
      
      if (!metadata) {
        console.warn('No metadata in notification:', notification);
        return;
      }

      if (!notification.read) {
        await markAsRead(notification.id);
      }
      
      switch (type) {
        case 'task_assigned':
        case 'task_updated':
          if (metadata.task_id && metadata.project_id) {
            const task = await fetchTaskDetails(metadata.task_id, metadata.project_id);
            if (task) {
              setSelectedTask(task);
              setIsTaskModalVisible(true);
            }
          }
          break;
        
        case 'team_invitation':
          if (metadata.project_id) {
            navigate(`/projects/${metadata.project_id}`);
          }
          break;
          
        default:
          console.warn('Unknown notification type:', type);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  }, [markAsRead, navigate]);

  const handleTaskModalClose = () => {
    setIsTaskModalVisible(false);
    setSelectedTask(null);
  };

  const handleTaskUpdate = (updatedTask) => {
    setSelectedTask(updatedTask);
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          const newNotification = data.data;
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close();
      };
    }
  }, [socket]);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationAction,
    selectedTask,
    isTaskModalVisible,
    handleTaskModalClose,
    handleTaskUpdate
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          visible={isTaskModalVisible}
          onCancel={handleTaskModalClose}
          onUpdate={handleTaskUpdate}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};