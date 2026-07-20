import React, { useEffect, useState } from "react";
import axios from "axios";

export default function HuntVoucher() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const id_user = user?.id;
  useEffect(() => {

    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:9999/admin/active-vouchers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVouchers(res.data.vouchers || []);
    } catch (e) {
      setMessage("Không thể tải voucher");
    }
    setLoading(false);
  };

  const handleHunt = async (id_voucher) => {
    setLoading(true);
    setMessage("");
    try {

      const res = await axios.post("http://localhost:9999/admin/hunt-voucher", { id_user: id_user, id_voucher }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || "Săn thành công!");
      if (res.data.duplicate) {
        setMessage("Bạn đã săn voucher này rồi!");
      }
      fetchVouchers();
    } catch (e) {
      setMessage(e.response?.data?.message || "Săn thất bại!");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Săn Voucher</h2>
      {loading && <div>Đang xử lý...</div>}
      {message && <div style={{ color: "red", margin: 8 }}>{message}</div>}
      <table border="1" cellPadding="8" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên</th>
            <th>Số lượng còn</th>
            <th>Giảm giá</th>
            <th>Loại</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map(v => (
            <tr key={v.id_voucher}>
              <td>{v.id_voucher}</td>
              <td>{v.name}</td>
              <td>{v.quantities}</td>
              <td>{v.discount}</td>
              <td>{v.type}</td>
              <td>
                <button onClick={() => handleHunt(v.id_voucher)} disabled={loading || v.quantities <= 0}>Săn</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
