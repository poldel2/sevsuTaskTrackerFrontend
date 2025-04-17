import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getNotificationsWebSocketUrl } from '../services/api';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  const connect = useCallback(() => {
    if (user) {
      const ws = new WebSocket(getNotificationsWebSocketUrl());
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setSocket(ws);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setSocket(null);
        // Переподключение через 3 секунды
        setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };

      return ws;
    }
  }, [user]);

  useEffect(() => {
    const ws = connect();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ socket }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};