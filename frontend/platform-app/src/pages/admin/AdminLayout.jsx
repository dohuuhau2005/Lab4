import { NavLink, Outlet } from "react-router-dom";
import "./admin.css";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>📦 Shop Admin</h2>
        </div>
        <nav className="admin-menu">
          <ul>
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
          </ul>
        </nav>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}