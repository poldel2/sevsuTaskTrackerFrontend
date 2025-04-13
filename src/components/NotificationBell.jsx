import React, { useState } from 'react';
import { IconButton, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotifications } from '../context/NotificationContext';
import NotificationDrawer from './NotificationDrawer';

const NotificationBell = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const handleDrawerOpen = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleDrawerOpen}
        sx={{ marginLeft: 2 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <NotificationDrawer
        open={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </>
  );
};

export default NotificationBell;