import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./CartPage.css"; // File CSS để trang trí thêm

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Lấy id_user từ localStorage
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    const id_user = user?.id;

    // URL gốc của backend (điều chỉnh lại nếu backend của bạn chạy port khác hoặc route khác)
    const API_BASE = "http://localhost:9999/customer/cart";

    // LẤY DANH SÁCH GIỎ HÀNG (GET)
    const loadCart = async () => {
        if (!id_user) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/${id_user}`);
            if (res.data.success) {
                setCartItems(res.data.data || []);
                setTotalPrice(res.data.totalPrice || 0);
            }
        } catch (error) {
            console.error("Lỗi khi tải giỏ hàng:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCart();
    }, []);

    // CẬP NHẬT SỐ LƯỢNG (PUT)
    // CẬP NHẬT SỐ LƯỢNG (PUT)
    const handleUpdateQuantity = async (id_cart_detail, currentQty, change, stock_quantity) => {
        const newQty = currentQty + change;

        // Tính số lượng tối đa được phép mua
        const maxAllowed = stock_quantity - 5;

        // Kịch bản 1: Nếu là hành động TĂNG (change > 0) và vượt quá giới hạn
        if (change > 0 && newQty > maxAllowed) {
            alert("Sản phẩm này đã hết hàng hoặc đạt giới hạn mua!");
            return; // Dừng luôn, không gọi API cập nhật nữa
        }

        // Kịch bản 2: Nếu số lượng tụt xuống < 1, hỏi người dùng có muốn xóa không
        if (newQty < 1) {
            handleDelete(id_cart_detail);
            return;
        }

        // Nếu qua được các bước kiểm tra trên thì gọi API cập nhật
        try {
            await axios.put(API_BASE, {
                id_cart_detail: id_cart_detail,
                quantities: newQty
            });
            loadCart(); // Tải lại giỏ hàng sau khi cập nhật thành công
        } catch (error) {
            console.error("Lỗi khi cập nhật số lượng:", error);
            alert("Không thể cập nhật số lượng lúc này!");
        }
    };

    // XÓA SẢN PHẨM KHỎI GIỎ (DELETE)
    const handleDelete = async (id_cart_detail) => {
        if (!window.confirm("Bạn có chắc chắn muốn bỏ sản phẩm này khỏi giỏ hàng?")) return;

        try {
            await axios.delete(`${API_BASE}/${id_cart_detail}`);
            loadCart(); // Tải lại giỏ hàng sau khi xóa
        } catch (error) {
            console.error("Lỗi khi xóa sản phẩm:", error);
            alert("Lỗi khi xóa sản phẩm khỏi giỏ hàng!");
        }
    };

    if (!id_user) {
        return (
            <div className="container py-5 text-center">
                <h3>Bạn chưa đăng nhập</h3>
                <p className="text-muted">Vui lòng đăng nhập để xem giỏ hàng của bạn.</p>
                <Link to="/login" className="btn btn-primary">Đến trang đăng nhập</Link>
            </div>
        );
    }

    return (
        <div className="container py-5 cart-page">
            <h2 className="mb-4 fw-bold">Giỏ hàng của bạn</h2>

            <div className="row g-4">
                {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 rounded-3">
                        <div className="card-body p-0">
                            {isLoading ? (
                                <div className="text-center py-5">Đang tải giỏ hàng...</div>
                            ) : cartItems.length === 0 ? (
                                <div className="text-center py-5">
                                    <h5 className="text-muted mb-3">Giỏ hàng của bạn đang trống 🛒</h5>
                                    <Link to="/" className="btn btn-outline-primary">Tiếp tục mua sắm</Link>
                                </div>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {cartItems.map((item) => (
                                        <li key={item.id_cart_detail} className="list-group-item d-flex align-items-center p-4">
                                            {/* Ảnh sản phẩm */}
                                            <img
                                                src={item.thumbnail || "https://via.placeholder.com/80"}
                                                alt={item.name_product}
                                                className="rounded me-3 object-fit-cover"
                                                style={{ width: "80px", height: "80px" }}
                                            />

                                            {/* Thông tin sản phẩm */}
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1 fw-semibold text-dark">{item.name_product}</h6>
                                                <div className="text-danger fw-bold mb-0">
                                                    {Number(item.new_price).toLocaleString('vi-VN')} đ
                                                </div>
                                                {item.old_price > item.new_price && (
                                                    <small className="text-muted text-decoration-line-through">
                                                        {Number(item.old_price).toLocaleString('vi-VN')} đ
                                                    </small>
                                                )}
                                            </div>

                                            {/* Tăng giảm số lượng */}
                                            <div className="d-flex align-items-center mx-3 quantity-control">
                                                {/* Nút Trừ */}
                                                <button
                                                    className="btn btn-sm btn-light border"
                                                    onClick={() => handleUpdateQuantity(
                                                        item.id_cart_detail,
                                                        item.quantities,
                                                        -1,
                                                        item.stock_quantity // Truyền thêm stock_quantity
                                                    )}
                                                >
                                                    -
                                                </button>

                                                <span className="mx-3 fw-medium">{item.quantities}</span>

                                                {/* Nút Cộng */}
                                                <button
                                                    className="btn btn-sm btn-light border"
                                                    onClick={() => handleUpdateQuantity(
                                                        item.id_cart_detail,
                                                        item.quantities,
                                                        1,
                                                        item.stock_quantity // Truyền thêm stock_quantity
                                                    )}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Thành tiền của 1 sản phẩm */}
                                            <div className="text-end me-4 fw-bold text-primary" style={{ minWidth: "120px" }}>
                                                {Number(item.total_price).toLocaleString('vi-VN')} đ
                                            </div>

                                            {/* Nút xóa */}
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(item.id_cart_detail)}
                                                title="Xóa sản phẩm"
                                            >
                                                <i className="bi bi-trash"></i> Xóa
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: Ô TÓM TẮT & THANH TOÁN */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 rounded-3 summary-card position-sticky" style={{ top: "20px" }}>
                        <div className="card-body p-4">
                            <h5 className="card-title fw-bold border-bottom pb-3 mb-3">Tóm tắt đơn hàng</h5>

                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Tổng sản phẩm:</span>
                                <span>{cartItems.length} món</span>
                            </div>

                            <div className="d-flex justify-content-between mb-3 border-bottom pb-3">
                                <span className="text-muted">Phí vận chuyển:</span>
                                <span>Chưa tính</span>
                            </div>

                            <div className="d-flex justify-content-between mb-4 align-items-center">
                                <span className="fw-bold fs-5">Tạm tính:</span>
                                <span className="text-danger fw-bold fs-4">
                                    {Number(totalPrice).toLocaleString('vi-VN')} đ
                                </span>
                            </div>

                            <button
                                className="btn btn-primary w-100 py-3 fw-bold fs-5 rounded-3"
                                disabled={cartItems.length === 0}
                                onClick={() => window.location.assign('/customer/checkout')}
                            >
                                THANH TOÁN
                            </button>
                            <div className="text-center mt-3">
                                <Link to="/" className="text-decoration-none small text-muted">
                                    <i className="bi bi-arrow-left"></i> Tiếp tục mua sắm
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}