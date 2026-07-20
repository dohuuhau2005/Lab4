import React, { useEffect, useState } from "react";
import axios from "axios";
import DeliveryInfoList from "./DeliveryInfoList";

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    const id_user = user?.id;

    // --- State quản lý Modal Hỗ trợ (Hủy / Đổi địa chỉ) ---
    const [modalData, setModalData] = useState({
        show: false,
        orderId: null,
        status: null
    });
    const [reason, setReason] = useState("");
    const [selectedNewAddress, setSelectedNewAddress] = useState(null);
    const [listAddresses, setListAddresses] = useState([]);

    // --- State quản lý Modal Hiển thị QR Thanh toán ---
    const [qrModalData, setQrModalData] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        if (!id_user) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:9999/customer/orders/history/${id_user}`);
            if (res.data.success) {
                setOrders(res.data.orders);
            }
        } catch (error) {
            console.error("Lỗi tải lịch sử đơn hàng:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Mở Popup Hỗ trợ
    const openActionModal = (orderId, status) => {
        setModalData({ show: true, orderId, status });
        setReason("");
        setSelectedNewAddress(null);
    };
    const closeModal = () => {
        setModalData({ show: false, orderId: null, status: null });
    };

    // Xử lý Gửi Yêu Cầu Hỗ Trợ
    const handleSubmitAction = async () => {
        if (!reason) return alert("Vui lòng chọn lý do!");

        // ĐỔI ĐỊA CHỈ: Trạng thái 0, 1, 2
        if (reason === "Sai địa chỉ" && (modalData.status === 0 || modalData.status === 1 || modalData.status === 2)) {
            if (!selectedNewAddress) return alert("Vui lòng chọn địa chỉ giao hàng mới!");
            const addrInfo = listAddresses.find(a => a.id_Info === selectedNewAddress);

            try {
                const res = await axios.put(`http://localhost:9999/customer/orders/update-address/${modalData.orderId}`, {
                    id_user: id_user,
                    name: addrInfo.name,
                    phone: addrInfo.phone,
                    address: addrInfo.address
                });
                if (res.data.success) {
                    alert("Cập nhật địa chỉ thành công!");
                    closeModal();
                    fetchOrders();
                }
            } catch (error) {
                alert("Lỗi khi cập nhật địa chỉ!");
            }
            return;
        }

        // HỦY ĐƠN HÀNG
        if (modalData.status === 2) {
            return alert("Đơn hàng đang giao, không thể hủy!");
        }

        try {
            const res = await axios.put(`http://localhost:9999/customer/orders/cancel/${modalData.orderId}`, {
                id_user: id_user,
                reason: reason
            });
            if (res.data.success) {
                alert("Đã hủy đơn hàng!");
                closeModal();
                fetchOrders();
            }
        } catch (error) {
            alert("Không thể hủy đơn hàng lúc này!");
        }
    };

    // Render Badge trạng thái Đơn hàng
    const renderStatus = (status) => {
        switch (status) {
            case 0: return <span style={{ color: '#f39c12', fontWeight: 'bold' }}>Chờ xác nhận</span>;
            case 1: return <span style={{ color: '#3498db', fontWeight: 'bold' }}>Đã xác nhận</span>;
            case 2: return <span style={{ color: '#9b59b6', fontWeight: 'bold' }}>Đang giao hàng</span>;
            case 3: return <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>Giao thành công</span>;
            case -1: return <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Đã hủy</span>;
            default: return <span>Không xác định</span>;
        }
    };

    if (!id_user) return <div className="container py-5">Vui lòng đăng nhập để xem lịch sử!</div>;

    return (
        <div className="container py-5">
            <h2 className="mb-4">Lịch sử đơn hàng</h2>

            {isLoading ? (
                <p>Đang tải dữ liệu...</p>
            ) : orders.length === 0 ? (
                <p>Bạn chưa có đơn hàng nào.</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {orders.map(order => (
                        <div key={order.id_order} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", backgroundColor: "#fff" }}>

                            {/* Header Đơn hàng */}
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "12px" }}>
                                <div>
                                    <h5 style={{ margin: 0 }}>Đơn hàng #{order.id_order}</h5>

                                    {/* CẬP NHẬT: Hiển thị trạng thái thanh toán cho đơn chuyển khoản */}
                                    <small style={{ color: "#7f8c8d", display: "flex", alignItems: "center", marginTop: "4px" }}>
                                        Thanh toán: <b style={{ marginLeft: 4 }}>{order.payment_type === 1 ? "Tiền mặt (COD)" : "Chuyển khoản (QR)"}</b>

                                        {order.payment_type === 2 && (
                                            <span style={{
                                                marginLeft: 8, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: "bold",
                                                backgroundColor: order.payment_status ? "#e8f5e9" : "#fff3cd",
                                                color: order.payment_status ? "#2e7d32" : "#856404",
                                                border: `1px solid ${order.payment_status ? "#c8e6c9" : "#ffeeba"}`
                                            }}>
                                                {order.payment_status ? "✓ Đã thanh toán" : "⚠ Chưa thanh toán"}
                                            </span>
                                        )}
                                    </small>

                                    <small style={{ color: "#7f8c8d", display: "block", marginTop: "4px" }}>
                                        Giao đến: {order.name} - {order.phone}
                                    </small>
                                    <small style={{ color: "#7f8c8d", display: "block" }}>
                                        Địa chỉ: {order.address}
                                    </small>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ marginBottom: 10 }}>Trạng thái: {renderStatus(order.order_status)}</div>

                                    {/* CẬP NHẬT: Hiện nút Thanh toán ngay nếu là CK và chưa thanh toán (và đơn chưa bị hủy) */}
                                    {order.payment_type === 2 && !order.payment_status && order.order_status !== -1 && (
                                        <button
                                            onClick={() => setQrModalData(order)}
                                            style={{ padding: "6px 12px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", marginRight: "8px" }}
                                        >
                                            Thanh toán ngay
                                        </button>
                                    )}

                                    {/* NÚT YÊU CẦU HỖ TRỢ */}
                                    {(order.order_status === 0 || order.order_status === 1 || order.order_status === 2) && (
                                        <button
                                            onClick={() => openActionModal(order.id_order, order.order_status)}
                                            style={{ padding: "6px 12px", backgroundColor: "#34495e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
                                        >
                                            Yêu cầu hỗ trợ
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Chi tiết Sản phẩm */}
                            <div>
                                {order.items && order.items.map((item, index) => (
                                    <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                                        <img src={item.img1 || "https://via.placeholder.com/50"} alt={item.name_product} style={{ width: 50, height: 50, marginRight: 15, borderRadius: 4, objectFit: "cover" }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: "bold" }}>{item.name_product}</div>
                                            <div style={{ fontSize: "12px", color: "#666" }}>Số lượng: {item.measure}</div>
                                        </div>
                                        <div style={{ fontWeight: "bold", color: "#e67e22" }}>
                                            {Number(item.price).toLocaleString('vi-VN')} đ
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer Đơn hàng */}
                            <div style={{ borderTop: "1px dashed #ddd", paddingTop: "12px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                                <span style={{ marginRight: "10px", fontSize: "14px" }}>Tổng thanh toán:</span>
                                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#d35400" }}>
                                    {Number(order.total_price).toLocaleString('vi-VN')} đ
                                </span>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* ==========================================
                POPUP MODAL: HIỂN THỊ MÃ QR THANH TOÁN
                ========================================== */}
            {qrModalData && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", width: "400px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}>
                        <h4 style={{ color: '#28a745', marginBottom: 15 }}>Thanh toán Đơn hàng #{qrModalData.id_order}</h4>
                        <p style={{ color: "#555", fontSize: 14 }}>Vui lòng mở App Ngân hàng và quét mã QR dưới đây để hoàn tất thanh toán.</p>

                        <div style={{ display: "flex", justifyContent: "center", margin: "15px 0" }}>
                            {/* Bro nhớ thay đổi STK và Ngân hàng của bro vào link API vietqr này nhé */}
                            <img
                                src={`https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${qrModalData.total_price}&addInfo=${qrModalData.id_payment}`}
                                alt="QR Code Thanh Toán"
                                style={{ width: 220, height: 220, border: "1px solid #eee", padding: 10, borderRadius: 8 }}
                            />
                        </div>

                        <h3 style={{ color: '#d35400', margin: "10px 0" }}>{Number(qrModalData.total_price).toLocaleString('vi-VN')} đ</h3>
                        <p style={{ fontSize: 15 }}>Nội dung CK: <b style={{ color: "#333", backgroundColor: "#f1f1f1", padding: "4px 8px", borderRadius: 4 }}>{qrModalData.id_payment}</b></p>

                        <button
                            onClick={() => setQrModalData(null)}
                            style={{ marginTop: 20, padding: "10px 20px", cursor: "pointer", border: "none", backgroundColor: "#6c757d", color: "#fff", borderRadius: 4, fontWeight: "bold", width: "100%" }}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* ==========================================
                POPUP MODAL: XỬ LÝ LÝ DO HỦY / ĐỔI ĐỊA CHỈ
                ========================================== */}
            {modalData.show && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 999, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", width: "550px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
                        <h4 style={{ marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                            Xử lý đơn hàng #{modalData.orderId}
                        </h4>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Vui lòng chọn lý do:</label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
                            >
                                <option value="">-- Chọn lý do của bạn --</option>
                                <option value="Đổi ý không mua nữa">Đổi ý không mua nữa</option>
                                <option value="Muốn thêm/bớt sản phẩm">Muốn thêm/bớt sản phẩm</option>
                                <option value="Tìm thấy giá rẻ hơn ở nơi khác">Tìm thấy giá rẻ hơn ở nơi khác</option>
                                <option value="Sai địa chỉ">Sai địa chỉ / Muốn đổi địa chỉ nhận</option>
                            </select>
                        </div>

                        {reason === "Sai địa chỉ" && (modalData.status === 0 || modalData.status === 1 || modalData.status === 2) ? (
                            <div style={{ border: "1px solid #17a2b8", padding: "15px", borderRadius: "6px", marginBottom: "20px", backgroundColor: "#f8ffff" }}>
                                <h6 style={{ color: "#17a2b8", marginBottom: "15px", fontWeight: "bold" }}>Chọn địa chỉ giao hàng mới:</h6>
                                <DeliveryInfoList
                                    selectedId={selectedNewAddress}
                                    onSelect={setSelectedNewAddress}
                                    onChange={(infos) => setListAddresses(infos)}
                                />
                            </div>
                        ) : (
                            reason && modalData.status === 2 && reason !== "Sai địa chỉ" && (
                                <div style={{ padding: "15px", backgroundColor: "#f8d7da", color: "#721c24", borderRadius: "4px", marginBottom: "20px" }}>
                                    <b>Lưu ý:</b> Đơn hàng đang trên đường giao, không thể tự động hủy. Vui lòng từ chối nhận hàng khi Shipper gọi!
                                </div>
                            )
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
                            <button
                                onClick={closeModal}
                                style={{ padding: "10px 20px", backgroundColor: "#f1f1f1", color: "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                            >
                                Đóng
                            </button>

                            <button
                                onClick={handleSubmitAction}
                                disabled={modalData.status === 2 && reason !== "Sai địa chỉ"}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: (reason === "Sai địa chỉ" && (modalData.status === 0 || modalData.status === 1 || modalData.status === 2)) ? "#17a2b8" : "#dc3545",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: (modalData.status === 2 && reason !== "Sai địa chỉ") ? "not-allowed" : "pointer",
                                    fontWeight: "bold",
                                    opacity: (modalData.status === 2 && reason !== "Sai địa chỉ") ? 0.6 : 1
                                }}
                            >
                                {(reason === "Sai địa chỉ" && (modalData.status === 0 || modalData.status === 1 || modalData.status === 2)) ? "Cập nhật địa chỉ" : "Xác nhận Hủy Đơn"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}