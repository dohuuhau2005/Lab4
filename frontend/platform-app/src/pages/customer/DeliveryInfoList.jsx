import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DeliveryInfoList({ selectedId, onSelect, onChange }) {
  const [infos, setInfos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: ""
  });

  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const id_user = user?.id;

  useEffect(() => {
    fetchInfos();
  }, []);

  const fetchInfos = async () => {
    if (!id_user) return;
    try {
      const res = await axios.get(`http://localhost:9999/delivery/info/${id_user}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // FIX 1: Lấy đúng key deliveryInfos mà Backend trả về
      const data = res.data.deliveryInfos || [];
      setInfos(data);
      if (onChange) onChange(data);
    } catch (error) {
      console.error("Lỗi fetch thông tin:", error);
    }
  };

  const handleSelect = (id) => {
    if (onSelect) onSelect(id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa thông tin này?")) return;
    try {
      // FIX 2: Sửa lại đúng endpoint DELETE
      await axios.delete(`http://localhost:9999/delivery/info/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInfos();
    } catch (error) {
      console.error("Lỗi xóa địa chỉ:", error);
    }
  };

  const handleEdit = (info) => {
    // FIX 3: Map đúng tên cột id_Info từ DB lên
    setEditId(info.id_Info);
    setForm({ name: info.name, phone: info.phone, address: info.address });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditId(null);
    setForm({ name: "", phone: "", address: "" });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        // FIX 4: Sửa lại đúng endpoint PUT
        await axios.put(`http://localhost:9999/delivery/info/${editId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`http://localhost:9999/delivery/info`, { ...form, id_user }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowForm(false);
      fetchInfos();
    } catch (error) {
      console.error("Lỗi lưu địa chỉ:", error);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h4>Thông tin giao hàng</h4>
      <button onClick={handleAdd}>Thêm địa chỉ</button>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {infos.map(info => (
          // Dùng đúng id_Info làm key
          <li key={info.id_Info} style={{ margin: 8, border: "1px solid #ccc", padding: 8, borderRadius: 4 }}>
            <label style={{ cursor: "pointer" }}>
              <input
                type="radio"
                checked={selectedId === info.id_Info}
                onChange={() => handleSelect(info.id_Info)}
              />
              <b> {info.name}</b> | {info.phone} | {info.address}
            </label>
            <button onClick={() => handleEdit(info)} style={{ marginLeft: 8 }}>Sửa</button>
            <button onClick={() => handleDelete(info.id_Info)} style={{ marginLeft: 8 }}>Xóa</button>
          </li>
        ))}
      </ul>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ margin: 8, border: "1px solid #aaa", padding: 8 }}>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tên người nhận" required />
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="SĐT" required style={{ marginLeft: 8 }} />
          <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Địa chỉ" required style={{ marginLeft: 8 }} />
          <button type="submit" style={{ marginLeft: 8 }}>{editId ? "Cập nhật" : "Thêm mới"}</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: 8 }}>Hủy</button>
        </form>
      )}
    </div>
  );
}