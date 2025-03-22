import React, { useEffect, useState, useRef } from "react";
import "../styles/Chat.css";
import { getMessages } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const Chat = ({ projectId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (!projectId || typeof projectId !== "number") {
            return;
        }

        // Загрузка истории сообщений
        getMessages(projectId)
            .then((data) => setMessages(data))
            .catch((err) => console.error("Ошибка загрузки сообщений:", err));

        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        // WebSocket с токеном в query-параметре
        const wsUrl = `ws://api.sevsutasktracker.ru/projects/${projectId}/chat/ws?token=${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages((prev) =>
                prev.some((msg) => msg.id === message.id) ? prev : [...prev, message]
            );
        };

        ws.current.onclose = (event) => {
            setIsConnected(false);
        };

        ws.current.onerror = () => {
            setIsConnected(false);
        };

        return () => {
            if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
                ws.current.close();
            }
        };
    }, [projectId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(input);
            setInput("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((msg) => (
                    <div key={msg.id} className="chat-message">
                        <span className="chat-sender">{msg.sender_name || "Unknown"}:</span>
                        <span className="chat-content">{msg.content}</span>
                        <span className="chat-timestamp">
                            {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите сообщение..."
                    disabled={!isConnected}
                />
                <button onClick={sendMessage} disabled={!isConnected}>
                    Отправить
                </button>
            </div>
            {!isConnected && <p style={{ color: "red" }}>Нет соединения с чатом</p>}
        </div>
    );
};

export default Chat;