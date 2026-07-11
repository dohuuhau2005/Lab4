import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // Nhớ import file CSS nhé

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
                localStorage.setItem("user", JSON.stringify(data));
                if (data.role === "STAFF" && data.position === "ADMIN") {
                    navigate("/admin/categories");
                } else if (data.role === "COMPANY") {
                    navigate("/company/products");
                } else if (data.role === "CUSTOMER") {
                    navigate("/customer/products");
                }
                else if (data.role === "DELIVERY") {
                    navigate("/delivery/offer");
                }
                else {
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
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h2>Chào mừng trở lại!</h2>
                    <p>Đăng nhập để quản lý cửa hàng của bạn</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Nhập email của bạn..."
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu..."
                            required
                        />
                    </div>

                    <button type="submit" className="login-button">
                        Đăng nhập
                    </button>
                </form>

                {message && (
                    <div className="login-message">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}