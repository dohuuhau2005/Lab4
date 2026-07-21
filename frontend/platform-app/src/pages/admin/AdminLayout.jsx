import React, { useState, useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import "./admin.css";

export default function AdminLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Kiểm tra token khi component được mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      // Tùy chọn nâng cao cho Admin: Nếu không có token, đá thẳng về trang chủ/login luôn
      // navigate("/"); 
    }
  }, [navigate]);

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    // 1. Xóa token
    localStorage.removeItem("token");
    setIsLoggedIn(false);

    // 2. Chuyển hướng về trang đăng nhập
    navigate("/");
  };

  return (
    <div className="admin-layout">
      {/* Cần đảm bảo .admin-sidebar trong admin.css có thuộc tính: display: flex; flex-direction: column; để nút logout bị đẩy xuống đáy */}
      <aside className="admin-sidebar" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <div className="admin-logo">
          <h2>📦 Shop Admin</h2>
        </div>

        <nav className="admin-menu" style={{ flexGrow: 1 }}>
          <ul>
            <li>
              <NavLink to="/admin/products" className={({ isActive }) => isActive ? "active" : ""}>
                Quản lý Sản phẩm
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/categories" className={({ isActive }) => isActive ? "active" : ""}>
                Quản lý Categories
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/pricetable" className={({ isActive }) => isActive ? "active" : ""}>
                Bảng giá sản phẩm
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/voucher" className={({ isActive }) => isActive ? "active" : ""}>
                Quản lý Voucher
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/orders" className={({ isActive }) => isActive ? "active" : ""}>
                Quản lý Đơn hàng
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                Bảng Thống kê
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* KHỐI ĐĂNG XUẤT (Nằm dưới cùng Sidebar) */}
        <div className="admin-logout-section" style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              style={{
                width: "100%", padding: "10px", background: "#ef4444",
                color: "white", border: "none", borderRadius: "6px",
                cursor: "pointer", fontWeight: "bold", fontSize: "15px"
              }}
            >
              🚪 Đăng xuất
            </button>
          ) : (
            <Link
              to="/"
              style={{
                display: "block", textAlign: "center", width: "100%",
                padding: "10px", background: "#3b82f6", color: "white",
                border: "none", borderRadius: "6px", textDecoration: "none",
                fontWeight: "bold", fontSize: "15px"
              }}
            >
              🔑 Đăng nhập
            </Link>
          )}
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}