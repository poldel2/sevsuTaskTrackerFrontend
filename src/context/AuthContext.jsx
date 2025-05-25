import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginLocal as apiLoginLocal, register, getCurrentUser, logout as apiLogout } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            getCurrentUser()
                .then(data => {
                    setUser(data);
                    setLoading(false);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const { access_token } = await apiLoginLocal(email, password);
        localStorage.setItem('token', access_token);
        const userData = await getCurrentUser();
        setUser(userData);
        navigate('/projects');
    };

    const loginLocal = async (code) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/login/sevsu/callback?code=${code}`);
            const data = await response.json();
            
            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
                const userData = await getCurrentUser();
                setUser(userData);
                return userData;
            } else {
                throw new Error('Не удалось получить токен доступа');
            }
        } catch (error) {
            console.error('Ошибка авторизации через SEVSU:', error);
            throw error;
        }
    };

    const loginSevsu = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/login/sevsu`;
    };

    const signup = async (userData) => {
        const response = await register(userData);
        localStorage.setItem('token', response.access_token);
        const userDataResponse = await getCurrentUser();
        setUser(userDataResponse);
        navigate('/projects');
    };

    const logout = async () => {
        await apiLogout();
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            loginLocal, 
            loginSevsu, 
            signup, 
            logout,
            updateUser 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);