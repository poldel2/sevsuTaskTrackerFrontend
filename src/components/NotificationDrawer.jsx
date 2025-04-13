import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const NotificationDrawer = ({ open, onClose }) => {
  const { 
    notifications, 
    markAllAsRead, 
    deleteNotification,
    handleNotificationAction 
  } = useNotifications();

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleDelete = (notificationId, event) => {
    event.stopPropagation();
    deleteNotification(notificationId);
  };

  const renderNotificationActions = (notification) => {
    switch (notification.type) {
      case 'task_assigned':
      case 'task_updated':
        return (
          <Button 
            size="small" 
            color="primary"
            onClick={() => handleNotificationAction(notification)}
          >
            Открыть задачу
          </Button>
        );
      
      case 'team_invitation':
        return (
          <Button 
            size="small" 
            color="primary"
            onClick={() => handleNotificationAction(notification)}
          >
            Перейти к проекту
          </Button>
        );
      
      default:
        return null;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 400 }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Уведомления</Typography>
          <Box>
            <Button 
              size="small" 
              onClick={handleMarkAllRead}
              sx={{ mr: 1 }}
            >
              Отметить все как прочитанные
            </Button>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        <List>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText primary="Нет уведомлений" />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ru
                        })}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {renderNotificationActions(notification)}
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={(e) => handleDelete(notification.id, e)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      </Box>
    </Drawer>
  );
};

export default NotificationDrawer;