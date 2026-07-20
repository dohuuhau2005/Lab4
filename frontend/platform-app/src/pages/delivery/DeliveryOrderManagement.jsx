import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DeliveryOrderManagement() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const user = JSON.parse(localStorage.getItem("user"));
    const idDeliverySystem = user?.DeliverySystemId;

    useEffect(() => {
        if (idDeliverySystem) {
            loadActiveOrders();
        }
    }, [idDeliverySystem]);

    const loadActiveOrders = async () => {
        setIsLoading(true);
        try {
            // Gọi API mới: Chỉ lấy đơn active (status = 2)
            const res = await axios.get(`http://localhost:9999/management/orders/delivery/${idDeliverySystem}`);
            if (res.data.success) setOrders(res.data.orders);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (orderId, newStatus, actionName) => {
        if (!window.confirm(`Xác nhận: ${actionName} đơn hàng #${orderId}?`)) return;

        try {
            // Gọi API cập nhật trạng thái chung
            await axios.put(`http://localhost:9999/management/orders/update-status/${orderId}`, {
                status: parseInt(newStatus)
            });

            alert(`Đã cập nhật: ${actionName}!`);
            // Load lại danh sách, đơn nào xử lý xong (khác 2) sẽ tự động biến mất khỏi danh sách này
            loadActiveOrders();
        } catch (error) {
            alert("Lỗi khi cập nhật trạng thái!");
        }
    };

    if (!idDeliverySystem) return <div className="container py-4">Lỗi: Tài khoản của bạn không có quyền giao hàng!</div>;

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
            <h3 className="mb-4 text-success fw-bold">🛵 Đơn Đang Giao (Đơn Vị #{idDeliverySystem})</h3>

            {isLoading ? <p>Đang tải danh sách đơn hàng...</p> : (
                <div className="row g-4">
                    {orders.length === 0 ? (
                        <div className="col-12 text-center py-5 bg-white rounded shadow-sm">
                            <h5 className="text-muted">Tuyệt vời! Hiện tại bạn không có đơn hàng nào cần giao.</h5>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div className="col-md-6 col-lg-4" key={order.id_order}>
                                <div className="card shadow-sm h-100 border-success" style={{ borderTop: "4px solid #28a745" }}>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                                            <h5 className="mb-0 fw-bold">Mã: #{order.id_order}</h5>
                                            {order.payment_type === 2 && order.payment_status === true ? (
                                                <span className="badge bg-success">Đã TT Online</span>
                                            ) : (
                                                <span className="badge bg-danger">Thu hộ: {Number(order.total_price).toLocaleString('vi-VN')} đ</span>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <div className="fw-bold fs-5 text-primary">{order.name}</div>
                                            <div className="fw-bold text-danger fs-5">📞 {order.phone}</div>
                                            <div className="text-muted mt-1">📍 {order.address}</div>
                                        </div>

                                        <div className="bg-light p-2 rounded mb-3" style={{ fontSize: "13px" }}>
                                            <strong>Sản phẩm:</strong>
                                            <ul className="mb-0 ps-3">
                                                {order.items.map((item, idx) => (
                                                    <li key={idx}>{item.name_product} (x{item.measure})</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="d-flex gap-2 mt-auto">
                                            {/* Nút Giao Thành Công -> Status = 3 */}
                                            <button
                                                className="btn btn-success flex-grow-1 fw-bold"
                                                onClick={() => handleAction(order.id_order, 3, "GIAO THÀNH CÔNG")}
                                            >
                                                ✅ Thành công
                                            </button>

                                            {/* Nút Hủy Giao -> Status = -1 */}
                                            <button
                                                className="btn btn-outline-danger fw-bold"
                                                onClick={() => handleAction(order.id_order, -1, "HỦY GIAO")}
                                            >
                                                ❌ Thất bại
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}