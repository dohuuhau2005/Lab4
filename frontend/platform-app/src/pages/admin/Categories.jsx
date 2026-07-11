import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Categories.css"; // Nhớ import CSS!

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");

  const token = localStorage.getItem("token");

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:9999/admin/categories", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && Array.isArray(res.data.categories)) {
        setCategories(res.data.categories);
      } else if (Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        console.error("Dữ liệu không khớp định dạng:", res.data);
        setCategories([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
      setCategories([]);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const categoryName = name.trim();
    if (!categoryName) return;

    try {
      await axios.post("http://localhost:9999/admin/categories",
        { nameCategories: [categoryName] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setName("");
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      console.error("Lỗi khi thêm danh mục:", error);
      alert(error.response?.data?.message || "Lỗi thêm danh mục, vui lòng thử lại!");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      await axios.delete(`http://localhost:9999/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    }
  };

  const handleEdit = (cat) => {
    setEditId(cat.id_categories);
    setName(cat.name);
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await axios.put(`http://localhost:9999/admin/categories/${editId}`, { nameCategories: name }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setEditId(null);
    setName("");
    setShowForm(false);
    fetchCategories();
  };

  return (
    <div className="cat-container">
      <div className="cat-header">
        <h2>Quản lý Categories</h2>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); setName(""); }}>
          + Thêm danh mục
        </button>
      </div>

      {showForm && (
        <form className="cat-form" onSubmit={editId ? handleUpdate : handleAdd}>
          <div className="cat-input-group">
            <label>Tên danh mục mới</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nhập tên category (VD: Áo thun)..."
              required
            />
          </div>
          <div className="cat-form-actions">
            <button type="submit" className="btn-success">{editId ? "Cập nhật" : "Lưu"}</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
          </div>
        </form>
      )}

      <div className="cat-table-wrapper">
        <table className="cat-table">
          <thead>
            <tr>
              <th width="10%">ID</th>
              <th>Tên Danh Mục</th>
              <th width="20%">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? categories.map(cat => (
              <tr key={cat.id_categories}>
                <td><strong>#{cat.id_categories}</strong></td>
                <td>{cat.name}</td>
                <td>
                  <div className="cat-actions">
                    <button className="btn-warning" onClick={() => handleEdit(cat)}>Sửa</button>
                    <button className="btn-danger" onClick={() => handleDelete(cat.id_categories)}>Xóa</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", padding: "20px" }}>Chưa có danh mục nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}