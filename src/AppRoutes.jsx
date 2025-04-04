import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import App from './App';
import ProjectsPage from './components/projects/ProjectsPage';
import LoginPage from './components/auth/LoginPage.jsx';
import RegisterPage from './components/auth/RegisterPage.jsx';
import PrivateRoute from './components/auth/PrivateRoute.jsx';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProjectSettings from "./components/projects/ProjectSettings.jsx";
import { logout } from "./services/api";

function AppRoutes() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Базовый маршрут для core */}
                    <Route path="/core" element={<App />}>
                        <Route index element={<Navigate to="/projects" replace />} />
                    </Route>
                    {/* Публичные маршруты */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/callback" element={<CallbackHandler />} />
                    {/* Защищённые маршруты */}
                    <Route
                        path="/projects"
                        element={<PrivateRoute><ProjectsPage /></PrivateRoute>}
                    />
                    <Route
                        path="/projects/:projectId/settings"
                        element={<PrivateRoute><ProjectSettings /></PrivateRoute>}
                    />
                    {/* Перенаправление для неизвестных путей */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

const CallbackHandler = () => {
    const { loginLocal } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            loginLocal(code).then(() => navigate('/projects'));
        }
    }, [loginLocal, navigate]);

    return <div>Processing login...</div>;
};

export default AppRoutes;