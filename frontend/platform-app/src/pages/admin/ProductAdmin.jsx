import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./admin.css";

export default function ProductAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:9999/admin/AdminProduct");
      if (res.data && res.data.products && res.data.products[0]) {
        setProducts(res.data.products[0]);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách sản phẩm:", error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await axios.delete(`http://localhost:9999/admin/product/${id}`);
      fetchProducts();
    } catch (error) {
      alert("Lỗi khi xóa sản phẩm!");
    }
  };

  return (
    <div className="admin-product-page">
      <h2>Quản lý sản phẩm</h2>
      <button onClick={() => navigate("/admin/products/add")}>+ Thêm sản phẩm</button>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên sản phẩm</th>
              <th>Giá mới</th>
              <th>Giá cũ</th>
              <th>Kho</th>
              <th>Trạng thái</th>
              <th>Ảnh</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id_product}>
                <td>{p.id_product}</td>
                <td>{p.name_product}</td>
                <td>{p.new_price?.toLocaleString()}</td>
                <td>{p.old_price?.toLocaleString()}</td>
                <td>{p.quantities}</td>
                <td>{p.status === 1 ? "Còn bán" : "Ẩn"}</td>
                <td>
                  {p.thumbnail && <img src={p.thumbnail} alt="thumb" style={{ width: 50 }} />}
                </td>
                <td>
                  <button onClick={() => navigate(`/admin/products/${p.id_product}`)}>Xem/Sửa</button>
                  {p.status === 1 ? (
                    <button onClick={() => handleDelete(p.id_product)} style={{ color: "red" }}>Xóa</button>
                  ) : (
                    <button onClick={async () => {
                      if (!window.confirm('Bạn muốn kích hoạt lại sản phẩm này?')) return;
                      try {
                        // Thêm {} vào tham số thứ 2
                        await axios.patch(`http://localhost:9999/admin/product/${p.id_product}`, {});
                        fetchProducts();
                      } catch (error) {
                        alert('Lỗi khi kích hoạt sản phẩm!');
                      }
                    }} style={{ color: 'green' }}>Active</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
