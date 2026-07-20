import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DeliveryInfoList from "./DeliveryInfoList";

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const id_user = user?.id;
  const token = localStorage.getItem("token");

  // State Giao hàng
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  const [deliveryInfos, setDeliveryInfos] = useState([]); // Lưu list address để bóc data lúc checkout
  const [isInternal, setIsInternal] = useState(1);
  const [deliveryOffers, setDeliveryOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);

  // State Voucher & Thanh toán
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState("");
  const [paymentType, setPaymentType] = useState(1); // 1: Tiền mặt, 2: Chuyển khoản

  // State quản lý UI sau khi tạo đơn
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  useEffect(() => {
    loadCart();
    loadVouchers();
  }, []);

  useEffect(() => {
    if (totalWeight > 0) loadDeliveryOffers();
  }, [totalWeight, isInternal]);

  const loadCart = async () => { /* Giữ nguyên như cũ */
    if (!id_user) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`http://localhost:9999/customer/cart/${id_user}`);
      if (res.data.success) {
        const items = res.data.data || [];
        setCartItems(items);
        setTotalPrice(res.data.totalPrice || 0);
        const weight = items.reduce((sum, item) => sum + (item.weight * item.quantities), 0);
        setTotalWeight(weight);
      } else {
        setError("Không thể lấy thông tin giỏ hàng.");
      }
    } catch (error) {
      setError("Lỗi khi tải giỏ hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadVouchers = async () => { /* Giữ nguyên như cũ */
    if (!id_user) return;
    try {
      const res = await axios.get(`http://localhost:9999/customer/Vouchers/${id_user}`);
      setVouchers(res.data.vouchers || []);
    } catch (error) {
      console.error("Lỗi tải voucher:", error);
    }
  };

  const loadDeliveryOffers = async () => { /* Giữ nguyên như cũ */
    try {
      const res = await axios.get(`http://localhost:9999/customer/chooseOffer`, {
        params: { TotalWeight: totalWeight, IsInternal: isInternal }
      });
      const offers = res.data.offers || [];
      setDeliveryOffers(offers);
      if (offers.length > 0) setSelectedOffer(offers[0]);
      else setSelectedOffer(null);
    } catch (error) {
      console.error("Lỗi lấy giá vận chuyển:", error);
    }
  };

  // TÍNH TIỀN
  const shippingFee = selectedOffer ? selectedOffer.FinalShipPrice : 0;
  let discountAmount = 0;
  const currentVoucher = vouchers.find(v => v.id_voucher === selectedVoucherId);
  if (currentVoucher) {
    if (currentVoucher.discount <= 100) {
      discountAmount = (totalPrice * currentVoucher.discount) / 100;
    } else {
      discountAmount = currentVoucher.discount;
    }
  }
  const finalTotal = Math.max(totalPrice + shippingFee - discountAmount, 0);

  // ==========================================
  // HÀM BẤM NÚT "ĐẶT HÀNG NGAY"
  // ==========================================
  const handleCheckout = async () => {
    // Tìm object address đầy đủ dựa trên ID đã chọn
    const fullDeliveryInfo = deliveryInfos.find(info => info.id_Info === selectedDeliveryId);

    if (!fullDeliveryInfo) {
      alert("Vui lòng chọn địa chỉ nhận hàng!");
      return;
    }
    const currentVoucher = vouchers.find(v => String(v.id_voucher) === String(selectedVoucherId));
    console.log("Voucher đã chọn:", currentVoucher);
    const payload = {
      id_user,
      cartItems,
      finalTotal,
      id_delivery_system: selectedOffer.id_delivery_system,
      deliveryInfo: fullDeliveryInfo,
      id_voucher: currentVoucher ? currentVoucher.id_voucher : null, // Nếu không chọn voucher thì gửi null
      paymentType // 1 hoặc 2
    };

    try {
      const res = await axios.post('http://localhost:9999/customer/checkout', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        if (paymentType === 2) {
          // Hiện Popup QR Code
          setOrderSuccessData(res.data);
        } else {
          // Tiền mặt thì sang trang thành công luôn
          alert("Đặt hàng thành công! Đơn hàng đang chờ xác nhận.");
          navigate('/customer/order-history'); // Chuyển hướng về lịch sử đơn
        }
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!");
    }
  };

  if (!id_user) return <div className="container py-5">Bạn chưa đăng nhập.</div>;

  // HIỂN THỊ POPUP QR NẾU CHỌN CHUYỂN KHOẢN VÀ ĐẶT THÀNH CÔNG
  if (orderSuccessData && paymentType === 2) {
    return (
      <div className="container py-5" style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#28a745' }}>Tạo Đơn Hàng Thành Công!</h2>
        <p>Mã đơn hàng: <b>#{orderSuccessData.id_order}</b></p>
        <div style={{ border: '1px solid #ccc', padding: 20, display: 'inline-block', borderRadius: 8, marginTop: 20 }}>
          <h4>Vui lòng quét mã để thanh toán</h4>
          {/* Sinh mã QR tự động theo chuẩn VietQR - Bro sửa lại STK và Ngân hàng của bro nhé */}
          <img
            src={`https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${orderSuccessData.total_price}&addInfo=${orderSuccessData.id_payment}`}
            alt="QR Code"
            style={{ width: 250, height: 250 }}
          />
          <h3 style={{ color: 'red' }}>{Number(orderSuccessData.total_price).toLocaleString('vi-VN')} đ</h3>
          <p>Nội dung CK: <b>{orderSuccessData.id_payment}</b></p>
        </div>
        <div style={{ marginTop: 20 }}>
          <button onClick={() => navigate('/order-history')} style={{ padding: "10px 20px", cursor: "pointer" }}>
            Tôi đã chuyển khoản xong
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="mb-4">Thanh toán</h2>
      {isLoading ? (
        <div>Đang tải giỏ hàng...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <div className="checkout-layout">
          {/* Sửa onChange để hứng trọn mảng deliveryInfos */}
          <DeliveryInfoList
            selectedId={selectedDeliveryId}
            onSelect={setSelectedDeliveryId}
            onChange={(infos) => setDeliveryInfos(infos)}
          />

          <div style={{ marginBottom: 24, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
            <h4>Vùng giao hàng</h4>
            <label style={{ marginRight: 20 }}>
              <input type="radio" name="area" checked={isInternal === 1} onChange={() => setIsInternal(1)} /> Nội thành
            </label>
            <label>
              <input type="radio" name="area" checked={isInternal === 0} onChange={() => setIsInternal(0)} /> Ngoại thành
            </label>
            <div style={{ fontSize: '13px', color: '#666', marginTop: 5 }}>
              *Tổng cân nặng đơn hàng: <b>{totalWeight} gram</b>
            </div>
          </div>

          <h4>Danh sách sản phẩm</h4>
          <table border="1" cellPadding="8" style={{ marginBottom: 24, width: '100%', textAlign: 'left' }}>
            {/* ... Giữ nguyên Render Table Sản Phẩm ... */}
            <thead style={{ backgroundColor: '#f4f4f4' }}>
              <tr>
                <th>Ảnh</th><th>Tên sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map(item => (
                <tr key={item.id_cart_detail}>
                  <td><img src={item.thumbnail || "https://via.placeholder.com/60"} alt={item.name_product} width={60} /></td>
                  <td>{item.name_product}</td>
                  <td>{item.quantities}</td>
                  <td>{Number(item.new_price).toLocaleString('vi-VN')} đ</td>
                  <td>{Number(item.total_price).toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ... Giữ nguyên Phần Đơn vị vận chuyển và Mã giảm giá ... */}
          {/* Đơn vị vận chuyển */}
          <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#fafafa', borderRadius: 8 }}>
            <h4>Đơn vị vận chuyển</h4>
            {deliveryOffers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {deliveryOffers.map(offer => (
                  <label key={offer.id_delivery_system} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <input
                      type="radio" name="deliveryOffer"
                      checked={selectedOffer?.id_delivery_system === offer.id_delivery_system}
                      onChange={() => setSelectedOffer(offer)} style={{ marginRight: 10 }}
                    />
                    <span style={{ flex: 1 }}><b>{offer.DeliveryCompanyName}</b> - Giao {offer.time_delivery}</span>
                    <strong style={{ color: '#0056b3' }}>{Number(offer.FinalShipPrice).toLocaleString('vi-VN')} đ</strong>
                  </label>
                ))}
              </div>
            ) : (<p style={{ color: "red" }}>Không tìm thấy đơn vị vận chuyển phù hợp.</p>)}
          </div>

          {/* Mã giảm giá */}
          <div style={{ marginBottom: 24, padding: 16, border: '1px dashed #28a745', borderRadius: 8 }}>
            <h4>Mã giảm giá (Voucher)</h4>
            {vouchers.length > 0 ? (
              <select value={selectedVoucherId} onChange={(e) => setSelectedVoucherId(e.target.value)} style={{ padding: '8px', width: '100%', maxWidth: '400px' }}>
                <option value="">-- Chọn mã giảm giá của bạn --</option>
                {vouchers.map(v => (
                  <option key={v.id_voucher} value={v.id_voucher}>
                    [{v.id_voucher}] {v.name} - Giảm {v.discount <= 100 ? `${v.discount}%` : `${Number(v.discount).toLocaleString('vi-VN')} đ`}
                  </option>
                ))}
              </select>
            ) : (<p style={{ fontStyle: "italic", color: "#666" }}>Bạn chưa có mã giảm giá nào.</p>)}
          </div>

          {/* ==============================================
              PHẦN MỚI BỔ SUNG: PHƯƠNG THỨC THANH TOÁN
              ============================================== */}
          <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#e9ecef', borderRadius: 8 }}>
            <h4>Phương thức thanh toán</h4>
            <div style={{ display: 'flex', gap: '20px', marginTop: 10 }}>
              <label style={{ cursor: "pointer", padding: "10px", border: paymentType === 1 ? "2px solid #ff5722" : "1px solid #ccc", background: "#fff", borderRadius: 4 }}>
                <input type="radio" checked={paymentType === 1} onChange={() => setPaymentType(1)} style={{ marginRight: 8 }} />
                Thanh toán khi nhận hàng (COD)
              </label>
              <label style={{ cursor: "pointer", padding: "10px", border: paymentType === 2 ? "2px solid #ff5722" : "1px solid #ccc", background: "#fff", borderRadius: 4 }}>
                <input type="radio" checked={paymentType === 2} onChange={() => setPaymentType(2)} style={{ marginRight: 8 }} />
                Chuyển khoản Ngân hàng (Mã QR)
              </label>
            </div>
          </div>

          {/* Tổng kết bill */}
          <div style={{ borderTop: "2px solid #333", paddingTop: 16, width: "100%", maxWidth: "400px", marginLeft: "auto" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Tiền hàng:</span> <span>{Number(totalPrice).toLocaleString('vi-VN')} đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Phí ship:</span> <span>+ {Number(shippingFee).toLocaleString('vi-VN')} đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: '#28a745' }}>
              <span>Voucher:</span> <span>- {Number(discountAmount).toLocaleString('vi-VN')} đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: "bold", fontSize: 20, color: '#d9534f' }}>
              <span>TỔNG CỘNG:</span> <span>{Number(finalTotal).toLocaleString('vi-VN')} đ</span>
            </div>

            <button
              style={{ width: "100%", padding: "12px", marginTop: "20px", backgroundColor: "#ff5722", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}
              disabled={!selectedDeliveryId || !selectedOffer}
              onClick={handleCheckout}
            >
              ĐẶT HÀNG NGAY
            </button>
            {(!selectedDeliveryId || !selectedOffer) && (
              <p style={{ color: 'red', fontSize: '13px', textAlign: 'center', marginTop: '10px' }}>
                * Vui lòng chọn địa chỉ và phương thức vận chuyển
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}