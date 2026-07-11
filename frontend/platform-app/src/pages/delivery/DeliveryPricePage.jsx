import React, { useEffect, useState } from "react";
import axios from "axios";
import "./DeliveryPricePage.css"; // Nhớ import CSS ở đây

export default function DeliveryPricePage() {
    const user = JSON.parse(localStorage.getItem("user"));
    const [prices, setPrices] = useState([]);
    const [form, setForm] = useState({
        min_weight: "",
        max_weight: "",
        over_weight_price: "",
        external_price: "",
        internal_price: "",
        time_delivery: ""
    });
    const [editingId, setEditingId] = useState(null);
    const idDeliverySystem = user?.DeliverySystemId;

    const loadPrices = async () => {
        try {
            const res = await axios.get(`http://localhost:9999/delivery/offers/${idDeliverySystem}`);
            setPrices(res.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadPrices();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const clearForm = () => {
        setForm({
            min_weight: "",
            max_weight: "",
            over_weight_price: "",
            external_price: "",
            internal_price: "",
            time_delivery: ""
        });
        setEditingId(null);
    };

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await axios.put(`http://localhost:9999/delivery/offer/${editingId}`, form);
            } else {
                await axios.post(`http://localhost:9999/delivery/offer`, {
                    ...form,
                    id_delivery_system: idDeliverySystem
                });
            }
            clearForm();
            loadPrices();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id_offer);
        setForm({
            min_weight: item.min_weight,
            max_weight: item.max_weight,
            over_weight_price: item.over_weight_price,
            external_price: item.external_price,
            internal_price: item.internal_price,
            time_delivery: item.time_delivery
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bảng giá này không?")) return;
        try {
            await axios.delete(`http://localhost:9999/delivery/offer/${id}`);
            loadPrices();
        } catch (error) {
            console.error(error);
        }
    };

    // Hàm chuyển đổi phút sang giờ
    const formatTime = (timeInMinutes) => {
        const mins = parseInt(timeInMinutes, 10);
        if (isNaN(mins)) return timeInMinutes; // Đề phòng user nhập chữ

        if (mins < 60) return `${mins} phút`;

        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hours} giờ ${remainingMins > 0 ? remainingMins + ' phút' : ''}`;
    };

    return (
        <div className="delivery-container">
            {/* Header Lời chào */}
            <div className="custom-card card">
                <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="mb-1 text-primary fw-bold">👋 Xin chào, {user?.FirstName || "Công Ty Vận Chuyển"}</h4>
                        <p className="text-muted mb-0">Quản lý cấu hình bảng giá cước vận chuyển của bạn</p>
                    </div>
                </div>
            </div>

            {/* Form Thêm/Sửa */}
            <div className="custom-card card">
                <div className="custom-card-header">
                    {editingId ? "✏️ Cập nhật bảng giá" : "➕ Thêm bảng giá mới"}
                </div>
                <div className="card-body">
                    <div className="row g-4">
                        <div className="col-md-4">
                            <label className="form-label">Khối lượng tối thiểu (g)</label>
                            <input type="number" name="min_weight" className="form-control" placeholder="VD: 0" value={form.min_weight} onChange={handleChange} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Khối lượng tối đa (g)</label>
                            <input type="number" name="max_weight" className="form-control" placeholder="VD: 1000" value={form.max_weight} onChange={handleChange} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Giá vượt cân (đ/kg)</label>
                            <input type="number" name="over_weight_price" className="form-control" placeholder="VD: 5000" value={form.over_weight_price} onChange={handleChange} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Giá nội thành (đ)</label>
                            <input type="number" name="internal_price" className="form-control" placeholder="VD: 20000" value={form.internal_price} onChange={handleChange} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Giá ngoại thành (đ)</label>
                            <input type="number" name="external_price" className="form-control" placeholder="VD: 35000" value={form.external_price} onChange={handleChange} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Thời gian giao (phút)</label>
                            <input type="number" name="time_delivery" className="form-control" placeholder="Nhập số phút (VD: 90)" value={form.time_delivery} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-top">
                        <button className={`btn btn-custom text-white me-2 ${editingId ? 'btn-warning' : 'btn-primary'}`} onClick={handleSubmit}>
                            {editingId ? "Lưu thay đổi" : "Lưu bảng giá"}
                        </button>
                        <button className="btn btn-custom btn-light border" onClick={clearForm}>
                            Hủy / Làm mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Bảng danh sách */}
            <div className="custom-card card">
                <div className="custom-card-header d-flex justify-content-between align-items-center">
                    <span>📋 Danh sách bảng giá đã cấu hình</span>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table custom-table mb-0">
                            <thead>
                                <tr>
                                    <th width="80">ID</th>
                                    <th>Từ (g)</th>
                                    <th>Đến (g)</th>
                                    <th>Nội thành</th>
                                    <th>Ngoại thành</th>
                                    <th>Vượt cân</th>
                                    <th>Thời gian dự kiến</th>
                                    <th width="150" className="text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prices.length > 0 ? (
                                    prices.map(item => (
                                        <tr key={item.id_offer}>
                                            <td className="fw-bold text-muted">#{item.id_offer}</td>
                                            <td>{Number(item.min_weight).toLocaleString('vi-VN')} g</td>
                                            <td>{Number(item.max_weight).toLocaleString('vi-VN')} g</td>
                                            <td className="text-success fw-medium">{Number(item.internal_price).toLocaleString('vi-VN')} đ</td>
                                            <td className="text-danger fw-medium">{Number(item.external_price).toLocaleString('vi-VN')} đ</td>
                                            <td>{Number(item.over_weight_price).toLocaleString('vi-VN')} đ</td>
                                            {/* ÁP DỤNG HÀM ĐỔI GIỜ Ở ĐÂY */}
                                            <td><span className="badge bg-info text-dark">{formatTime(item.time_delivery)}</span></td>
                                            <td className="text-center">
                                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(item)}>
                                                    Sửa
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id_offer)}>
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-5 text-muted">
                                            Chưa có bảng giá nào. Hãy thêm mới ở form phía trên!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}