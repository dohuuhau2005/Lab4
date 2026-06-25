import { Link, Outlet } from "react-router-dom";
import "./admin.css";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-menu">
        <ul>
          <li><Link to="/admin/categories">Quản lý categories</Link></li>
        </ul>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
