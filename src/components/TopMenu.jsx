import React from "react";
import "../styles/topMenu.css";
import { UserOutlined, DownOutlined } from "@ant-design/icons";
import { Dropdown, Menu } from "antd";
import {useAuth} from "../context/AuthContext.jsx";

const menuItems = [
    { key: "work", label: "Работа" },
    { key: "projects", label: "Проекты" },
    { key: "teams", label: "Команды" },
    { key: "plans", label: "Планы" },
];

const dropdownMenu = (
    <Menu>
        <Menu.Item key="1">Опция 1</Menu.Item>
        <Menu.Item key="2">Опция 2</Menu.Item>
        <Menu.Item key="3">Опция 3</Menu.Item>
    </Menu>
);

const TopMenu = () => {
    const { user, logout } = useAuth();
    return (
        <header className="top-menu">
            {/* Логотип */}
            <div className="logo">
                <img src="/assets/logo_blue.svg" alt="Logo" className="logo-img" />
            </div>

            {/* Навигация */}
            <nav className="nav">
                {menuItems.map((item) => (
                    <Dropdown key={item.key} overlay={dropdownMenu} trigger={["click"]}>
                        <div className="nav-item">
                            {item.label} <DownOutlined className="down_arrow" />
                        </div>
                    </Dropdown>
                ))}
            </nav>

            {/* Аватар пользователя */}
            <div className="user-avatar">
                {/*<p> {user.email}!</p>*/}
                <button onClick={logout}>Logout</button>
            </div>
        </header>
    );
};


export default TopMenu;
