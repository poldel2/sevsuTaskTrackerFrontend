import { useState } from 'react';
import { Layout, Menu, Dropdown, Button, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import logo from '../assets/logo.png';

const { Header } = Layout;

const AppHeader = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const items = [
    {
      key: '1',
      label: (
        <Button type="text" onClick={logout}>
          Выйти
        </Button>
      ),
    },
  ];

  return (
    <Header>
      <div className="header-content">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" onClick={() => navigate('/')} />
        </div>
        
        <div className="right-section">
          <Space>
            <NotificationBell />
            <Dropdown menu={{ items }} placement="bottomRight">
              <Button icon={<UserOutlined />}>{user?.first_name || 'Пользователь'}</Button>
            </Dropdown>
          </Space>
        </div>
      </div>
    </Header>
  );
};

export default AppHeader;