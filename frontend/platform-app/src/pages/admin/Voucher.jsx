import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Voucher.css"; // Nhớ CSS thêm các class màu cho badge nhé

// Helper fix lỗi timezone khi bind data vào thẻ <input type="datetime-local">
const formatDateForInput = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date - tzOffset).toISOString().slice(0, 16);
};

export default function Voucher() {
  const [vouchers, setVouchers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const initialFormState = {
    id_voucher: "",
    quantities: 1,
    time_deploy: "",
    time_end: "",
    time_exp: "",
    name: "",
    discount: 0,
    type: "AMOUNT", // Cho cái giá trị mặc định luôn
    voucher_status: 0 // Mặc định tạo mới là Pending (0)
  };

  const [form, setForm] = useState(initialFormState);
  const token = localStorage.getItem("token");

  const fetchVouchers = async () => {
    try {
      const res = await axios.get("http://localhost:9999/admin/voucher", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVouchers(res.data.vouchers || []);
    } catch (error) {
      console.error("Lỗi fetch voucher:", error);
    }
  };

  useEffect(() => { fetchVouchers(); }, []);

  const handleChange = e => {
    const { name, value, type } = e.target;
    setForm(f => ({
      ...f,
      // Đảm bảo voucher_status luôn là số nguyên (Integer)
      [name]: name === "voucher_status" ? parseInt(value, 10) : value
    }));
  };

  const handleAdd = async e => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:9999/admin/voucher", form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowForm(false);
      setForm(initialFormState);
      fetchVouchers();
    } catch (error) {
      alert("Lỗi khi thêm voucher!");
    }
  };

  const handleEdit = v => {
    setEditId(v.id_voucher);
    setForm({
      ...v,
      time_deploy: formatDateForInput(v.time_deploy),
      time_end: formatDateForInput(v.time_end),
      time_exp: formatDateForInput(v.time_exp)
    });
    setShowForm(true);
  };

  const handleUpdate = async e => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:9999/admin/voucher/${editId}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditId(null);
      setShowForm(false);
      setForm(initialFormState);
      fetchVouchers();
    } catch (error) {
      alert("Lỗi khi cập nhật voucher!");
    }
  };

  const handleLock = async id => {
    // API xóa này dưới Backend nên update status thành -1 thay vì xóa cứng (DELETE) nhé
    if (window.confirm("Bạn có chắc chắn muốn khóa voucher này?")) {
      try {
        await axios.delete(`http://localhost:9999/admin/voucher/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchVouchers();
      } catch (error) {
        alert("Lỗi khi khóa voucher!");
      }
    }
  };

  // Hàm render UI nhãn trạng thái xịn xò
  const renderStatusBadge = (status) => {
    switch (status) {
      case -1: return <span className="status-badge locked" style={{ backgroundColor: '#ff4d4f', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>Đã khóa</span>;
      case 0: return <span className="status-badge pending" style={{ backgroundColor: '#faad14', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>Chờ phát hành</span>;
      case 1: return <span className="status-badge deploy" style={{ backgroundColor: '#1890ff', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>Đã Deploy</span>;
      case 2: return <span className="status-badge active" style={{ backgroundColor: '#52c41a', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>Hoạt động</span>;
      default: return <span className="status-badge">Unknown</span>;
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
            setForm(initialFormState);
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
                <input name="quantities" type="number" value={form.quantities} onChange={handleChange} min={1} required />
              </div>

              <div className="form-group">
                <label>Giảm giá (VNĐ hoặc %)</label>
                <input name="discount" type="number" value={form.discount} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Loại (Phân loại)</label>
                <select name="type" value={form.type} onChange={handleChange} required>
                  <option value="AMOUNT">VNĐ (Amount)</option>
                  <option value="PERCENT">% (Percent)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Thời gian bắt đầu</label>
                <input name="time_deploy" type="datetime-local" value={form.time_deploy} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Thời gian kết thúc</label>
                <input name="time_end" type="datetime-local" value={form.time_end} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Thời gian hết hạn</label>
                <input name="time_exp" type="datetime-local" value={form.time_exp} onChange={handleChange} required />
              </div>

              {/* Chỉ hiện chổ đổi trạng thái khi đang Edit */}
              {editId && (
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="voucher_status" value={form.voucher_status} onChange={handleChange}>
                    <option value={-1}>Khóa (-1)</option>
                    <option value={0}>Chờ phát hành (0)</option>
                    <option value={1}>Đã Deploy (1)</option>
                    <option value={2}>Hoạt động (2)</option>
                  </select>
                </div>
              )}
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
              <th>Hết hạn</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length > 0 ? vouchers.map(v => (
              <tr key={v.id_voucher} className={v.voucher_status === -1 ? "row-locked" : ""}>
                <td><strong>{v.id_voucher}</strong></td>
                <td>{v.name}</td>
                <td>{v.quantities}</td>
                <td>{v.discount}</td>
                <td><span className="badge-type">{v.type}</span></td>
                <td>{new Date(v.time_deploy).toLocaleString("vi-VN")}</td>
                <td>{new Date(v.time_end).toLocaleString("vi-VN")}</td>
                <td>{new Date(v.time_exp).toLocaleString("vi-VN")}</td>
                <td>
                  {renderStatusBadge(v.voucher_status)}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => handleEdit(v)} disabled={v.voucher_status === -1}>Sửa</button>
                    <button className="btn-lock" onClick={() => handleLock(v.id_voucher)} disabled={v.voucher_status === -1}>Khóa</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>Chưa có voucher nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}