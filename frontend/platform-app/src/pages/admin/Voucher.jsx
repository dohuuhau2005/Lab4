import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Voucher.css"; // Import file CSS giao diện

export default function Voucher() {
  const [vouchers, setVouchers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    id_voucher: "",
    quantities: 1,
    time_deploy: "",
    time_end: "",
    name: "",
    discount: 0,
    type: "",
    is_Locked: false
  });
  const token = localStorage.getItem("token");

  const fetchVouchers = async () => {
    const res = await axios.get("http://localhost:9999/admin/voucher", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setVouchers(res.data.vouchers || []);
  };

  useEffect(() => { fetchVouchers(); }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleAdd = async e => {
    e.preventDefault();
    await axios.post("http://localhost:9999/admin/voucher", {
      ...form,
      is_Locked: !!form.is_Locked
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setShowForm(false);
    setForm({ id_voucher: "", quantities: 1, time_deploy: "", time_end: "", name: "", discount: 0, type: "", is_Locked: false });
    fetchVouchers();
  };

  const handleEdit = v => {
    setEditId(v.id_voucher);
    setForm({ ...v });
    setShowForm(true);
  };

  const handleUpdate = async e => {
    e.preventDefault();
    await axios.put(`http://localhost:9999/admin/voucher/${editId}`, {
      ...form,
      is_Locked: !!form.is_Locked
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setEditId(null);
    setShowForm(false);
    setForm({ id_voucher: "", quantities: 1, time_deploy: "", time_end: "", name: "", discount: 0, type: "", is_Locked: false });
    fetchVouchers();
  };

  const handleLock = async id => {
    if (window.confirm("Bạn có chắc chắn muốn khóa voucher này?")) {
      await axios.delete(`http://localhost:9999/admin/voucher/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchVouchers();
    }
  };

  return (
    <div className="voucher-container">
      <div className="voucher-header">
        <h2>Quản lý Voucher</h2>
        <button
          className="btn-add"
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm({ id_voucher: "", quantities: 1, time_deploy: "", time_end: "", name: "", discount: 0, type: "", is_Locked: false });
          }}>
          + Thêm Voucher
        </button>
      </div>

      {showForm && (
        <div className="voucher-form-card">
          <h3>{editId ? "Cập nhật Voucher" : "Thêm Voucher Mới"}</h3>
          <form onSubmit={editId ? handleUpdate : handleAdd}>
            <div className="form-grid">
              {!editId && (
                <div className="form-group">
                  <label>Mã Voucher (Tối đa 10 kí tự)</label>
                  <input
                    name="id_voucher"
                    value={form.id_voucher}
                    onChange={handleChange}
                    placeholder="VD: TET2024"
                    maxLength={10}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Tên Voucher</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="VD: Giảm giá ngày lễ" required />
              </div>

              <div className="form-group">
                <label>Số lượng</label>
                <input name="quantities" type="number" value={form.quantities} onChange={handleChange} placeholder="Số lượng phát hành" min={1} required />
              </div>

              <div className="form-group">
                <label>Giảm giá (VNĐ hoặc %)</label>
                <input name="discount" type="number" value={form.discount} onChange={handleChange} placeholder="Mức giảm" required />
              </div>

              <div className="form-group">
                <label>Loại (Phân loại)</label>
                <input name="type" value={form.type} onChange={handleChange} placeholder="VD: PERCENT hoặc AMOUNT" required />
              </div>

              <div className="form-group">
                <label>Thời gian bắt đầu</label>
                <input name="time_deploy" type="datetime-local" value={form.time_deploy} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Thời gian kết thúc</label>
                <input name="time_end" type="datetime-local" value={form.time_end} onChange={handleChange} required />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input name="is_Locked" type="checkbox" checked={!!form.is_Locked} onChange={handleChange} />
                  Khóa Voucher này
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">{editId ? "Cập nhật" : "Thêm mới"}</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-responsive">
        <table className="voucher-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên</th>
              <th>Số lượng</th>
              <th>Giảm giá</th>
              <th>Loại</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length > 0 ? vouchers.map(v => (
              <tr key={v.id_voucher} className={v.is_Locked ? "row-locked" : ""}>
                <td><strong>{v.id_voucher}</strong></td>
                <td>{v.name}</td>
                <td>{v.quantities}</td>
                <td>{v.discount}</td>
                <td><span className="badge-type">{v.type}</span></td>
                <td>{new Date(v.time_deploy).toLocaleString("vi-VN")}</td>
                <td>{new Date(v.time_end).toLocaleString("vi-VN")}</td>
                <td>
                  <span className={`status-badge ${v.is_Locked ? "locked" : "active"}`}>
                    {v.is_Locked ? "Đã khóa" : "Hoạt động"}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => handleEdit(v)} disabled={v.is_Locked}>Sửa</button>
                    <button className="btn-lock" onClick={() => handleLock(v.id_voucher)} disabled={v.is_Locked}>Khóa</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>Chưa có voucher nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}