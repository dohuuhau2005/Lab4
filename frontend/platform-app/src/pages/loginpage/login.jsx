import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            const res = await axios.post("http://localhost:9999/login", { email, password });
            const data = res.data;
            if (data.success) {
                localStorage.setItem("token", data.token);
                if (data.role === "STAFF" && data.position === "ADMIN") {
                    navigate("/admin/categories");
                } else if (data.role === "COMPANY") {
                    navigate("/company/products");
                } else {
                    setMessage("Không xác định quyền đăng nhập");
                }
            } else {
                setMessage(data.message || "Đăng nhập thất bại");
            }
        } catch (err) {
            setMessage(err.response?.data?.message || "Lỗi kết nối đến server");
        }
    };

    return (
        <div className="login-container">
            <h2>Đăng nhập</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit">Đăng nhập</button>
            </form>
            {message && <div className="message">{message}</div>}
        </div>
    );
}