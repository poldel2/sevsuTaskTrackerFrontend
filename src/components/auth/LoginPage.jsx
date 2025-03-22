import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loginSevsu } = useAuth();

    const handleLocalLogin = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (err) {
            // Извлекаем сообщение об ошибке из ответа бэкенда
            const errorMessage = err.detail || err.message || 'Login failed';
            setError(errorMessage);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLocalLogin}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Login</button>
            </form>
            <button onClick={loginSevsu}>Login with SEVSU</button>
        </div>
    );
};

export default LoginPage;