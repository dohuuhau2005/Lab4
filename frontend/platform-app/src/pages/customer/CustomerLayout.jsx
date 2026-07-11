import React, { useState, useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import "./CustomerLayout.css";

export default function CustomerLayout() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    // Kiểm tra token trong localStorage khi component được mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsLoggedIn(true);

            // Tùy chọn: Nếu bạn muốn lấy thông tin email, role từ token để hiển thị "Xin chào..."
            // bạn có thể decode nó (dùng thư viện jwt-decode hoặc tự parse base64).
        } else {
            setIsLoggedIn(false);
        }
    }, []);

    // Hàm xử lý đăng xuất
    const handleLogout = () => {
        // Xóa token khỏi localStorage
        localStorage.removeItem("token");
        setIsLoggedIn(false);

        // Điều hướng người dùng về lại trang đăng nhập (hoặc trang chủ tùy bạn)
        navigate("/");
    };

    return (
        <div className="customer-layout">
            {/* HEADER */}
            <header className="customer-header">
                <div className="header-container">
                    <Link to="/" className="header-logo">
                        🛒 <span>SuperShop</span>
                    </Link>

                    <nav className="header-nav">
                        <NavLink to="/customer/products" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                            Trang chủ
                        </NavLink>

                        <NavLink to="/customer/vouchers" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                            🔥 Săn Voucher
                        </NavLink>
                    </nav>

                    <div className="header-actions">
                        <Link to="/customer/cart" className="action-btn cart-btn">
                            🛍️ Giỏ hàng <span className="cart-badge">0</span>
                        </Link>

                        {/* KIỂM TRA TRẠNG THÁI ĐỂ HIỂN THỊ NÚT */}
                        {isLoggedIn ? (
                            <button onClick={handleLogout} className="action-btn logout-btn">Đăng xuất</button>
                        ) : (
                            <Link to="/" className="action-btn login-btn">Đăng nhập</Link>
                        )}
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="customer-main">
                <Outlet />
            </main>

            {/* FOOTER */}
            <footer className="customer-footer">
                <p>© 2026 SuperShop. Code with ❤️ by you!</p>
            </footer>
        </div>
    );
}