import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminOrderManagement() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => { loadOrders(); }, []);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get("http://localhost:9999/management/orders/admin/all");
            if (res.data.success) setOrders(res.data.orders);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        if (!window.confirm(`Đổi trạng thái đơn #${orderId}?`)) return;
        try {
            await axios.put(`http://localhost:9999/management/orders/update-status/${orderId}`, { status: parseInt(newStatus) });
            setOrders(orders.map(o => o.id_order === orderId ? { ...o, status: parseInt(newStatus) } : o));
            alert("Đã cập nhật!");
        } catch (error) {
            alert("Lỗi cập nhật!");
        }
    };

    return (
        <div className="container-fluid py-4">
            <h3 className="mb-4 text-primary">👑 Hệ Thống Quản Trị Đơn Hàng (Toàn Cục)</h3>
            {isLoading ? <p>Đang tải...</p> : (
                <div className="table-responsive bg-white p-3 rounded shadow-sm">
                    <table className="table table-hover align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th>Mã Đơn</th>
                                <th>Khách Hàng</th>
                                <th>Tổng Tiền</th>
                                <th>Đơn Vị VC (ID)</th>
                                <th>Trạng Thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id_order}>
                                    <td className="fw-bold">#{order.id_order}</td>
                                    <td>
                                        <div>{order.name}</div>
                                        <small className="text-muted">{order.phone}</small>
                                    </td>
                                    <td className="text-danger fw-bold">{Number(order.total_price).toLocaleString('vi-VN')} đ</td>
                                    <td>{order.id_delivery_system || "Chưa gán"}</td>
                                    <td>
                                        <select
                                            className="form-select form-select-sm shadow-none"
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id_order, e.target.value)}
                                            // Khóa toàn bộ ô select nếu đơn đã chốt hạ (3 hoặc -1)
                                            disabled={order.status === 3 || order.status === -1}
                                            style={{
                                                backgroundColor: (order.status === 3 || order.status === -1) ? "#e9ecef" : "#fff",
                                                cursor: (order.status === 3 || order.status === -1) ? "not-allowed" : "pointer"
                                            }}
                                        >
                                            <option value={0}>Chờ xác nhận</option>
                                            <option value={1}>Đã xác nhận</option>
                                            <option value={2}>Đang giao hàng</option>

                                            {/* KHÓA 2 OPTION NÀY: Admin không được quyền tự chọn */}
                                            {/* Nó chỉ được "mở" ra để hiển thị chữ nếu đơn hàng HIỆN TẠI đang mang số 3 hoặc -1 */}
                                            <option value={3} disabled={order.status !== 3}>Giao thành công</option>
                                            <option value={-1} disabled={order.status !== -1}>Đã hủy</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}