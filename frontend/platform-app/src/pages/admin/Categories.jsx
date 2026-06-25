import React, { useEffect, useState } from "react";
import axios from "axios";

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

      // Chọc thẳng vào res.data.categories vì API của bro trả về key này
      if (res.data && Array.isArray(res.data.categories)) {
        setCategories(res.data.categories);
      } else if (Array.isArray(res.data)) {
        setCategories(res.data); // Phòng hờ lỡ API khác trả thẳng mảng
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

    // Xóa khoảng trắng thừa ở 2 đầu, rỗng thì dừng
    const categoryName = name.trim();
    if (!categoryName) return;

    try {
      await axios.post("http://localhost:9999/admin/categories",
        {
          // Bọc tên danh mục vào mảng để khớp với logic OPENJSON ở Backend
          nameCategories: [categoryName]
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Thành công thì reset form và tải lại danh sách
      setName("");
      setShowForm(false);
      fetchCategories();

    } catch (error) {
      console.error("Lỗi khi thêm danh mục:", error);
      // Báo lỗi ra màn hình cho người dùng biết (có thể dùng toast/alert)
      alert(error.response?.data?.message || "Lỗi thêm danh mục, vui lòng thử lại!");
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:9999/admin/categories/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchCategories();
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
    setEditId(null); setName(""); setShowForm(false); fetchCategories();
  };

  return (
    <div>
      <h2>Quản lý Categories</h2>
      <button onClick={() => { setShowForm(true); setEditId(null); setName(""); }}>Thêm</button>
      {showForm && (
        <form onSubmit={editId ? handleUpdate : handleAdd}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên category" required />
          <button type="submit">{editId ? "Cập nhật" : "Thêm mới"}</button>
          <button type="button" onClick={() => setShowForm(false)}>Hủy</button>
        </form>
      )}
      <table border="1" cellPadding="8" style={{ marginTop: 16 }}>
        <thead>
          <tr><th>ID</th><th>Tên</th><th>Hành động</th></tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id_categories}>
              <td>{cat.id_categories}</td>
              <td>{cat.name}</td>
              <td>
                <button onClick={() => handleEdit(cat)}>Sửa</button>
                <button onClick={() => handleDelete(cat.id_categories)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
