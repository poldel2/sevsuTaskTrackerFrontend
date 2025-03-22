import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginLocal, register, getCurrentUser, logout as apiLogout } from '../services/api';

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
        const { access_token } = await loginLocal(email, password);
        localStorage.setItem('token', access_token);
        const userData = await getCurrentUser();
        setUser(userData);
        navigate('/projects');
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

    return (
        <AuthContext.Provider value={{ user, loading, login, loginSevsu, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);