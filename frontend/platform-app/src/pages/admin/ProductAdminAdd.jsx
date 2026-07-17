import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ProductAdminDetail.css"; // Dùng lại file CSS "dát vàng" hôm trước nhé

export default function ProductAdminAdd() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState([]);

  // 1. Tách State cho gọn gàng dễ quản lý
  const [form, setForm] = useState({
    name_product: "",
    price: "", // Đổi thành price để khớp với Backend: const { price } = req.body
    old_price: "",
    quantities: "",
    description: "",
    meta_title: "",
    weight: "",
  });

  const [categories, setCategories] = useState([]); // Chứa mảng ID danh mục, vd: [1, 3]
  const [thumbnail, setThumbnail] = useState(null); // 1 file
  const [images, setImages] = useState([]); // Mảng nhiều file

  // Lấy danh sách danh mục để render Checkbox
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:9999/admin/categories");
        if (res.data && res.data.categories) {
          setAllCategories(res.data.categories);
        }
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleTextChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (id) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      // Append dữ liệu Text
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Append Categories (Ép thành chuỗi JSON "[1,3]" cho Backend xử lý)
      formData.append("categories", JSON.stringify(categories));

      // Append 1 file Thumbnail
      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      // Append NHIỀU file Images (Dùng vòng lặp cắm cùng 1 key "images")
      if (images && images.length > 0) {
        Array.from(images).forEach((file) => {
          formData.append("images", file);
        });
      }

      await axios.post("http://localhost:9999/admin/product", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        },
      });

      alert("Thêm sản phẩm thành công!");
      navigate("/admin/products");

    } catch (error) {
      console.error("Lỗi thêm SP:", error);
      alert("Lỗi khi thêm sản phẩm, vui lòng thử lại!");
    }
    setLoading(false);
  };

  return (
    <div className="admin-detail-container">
      <div className="header-section">
        <h2>Thêm Sản Phẩm Mới</h2>
        <button className="btn btn-back" onClick={() => navigate("/admin/products")}>
          ⬅ Hủy & Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="info-card">
          <div className="card-header">
            <h3>Thông tin cơ bản</h3>
          </div>
          <div className="info-grid">
            <div className="form-group">
              <label className="info-label">Tên sản phẩm *</label>
              <input className="form-control" name="name_product" placeholder="Nhập tên SP" value={form.name_product} onChange={handleTextChange} required />
            </div>
            <div className="form-group">
              <label className="info-label">Giá mới *</label>
              <input className="form-control" type="number" name="price" placeholder="Ví dụ: 150000" value={form.price} onChange={handleTextChange} required />
            </div>
            <div className="form-group">
              <label className="info-label">Số lượng kho *</label>
              <input className="form-control" type="number" name="quantities" placeholder="Ví dụ: 20" value={form.quantities} onChange={handleTextChange} required />
            </div>
            <div className="form-group">
              <label className="info-label">Khối lượng (g) *</label>
              <input className="form-control" type="number" name="weight" placeholder="Ví dụ: 200" value={form.weight} onChange={handleTextChange} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="info-label">Meta Title</label>
              <input className="form-control" name="meta_title" placeholder="SEO Title" value={form.meta_title} onChange={handleTextChange} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="info-label">Mô tả chi tiết</label>
              <textarea className="form-control" rows="4" name="description" placeholder="Viết mô tả sản phẩm..." value={form.description} onChange={handleTextChange} />
            </div>
          </div>
        </div>

        {/* Khối chọn danh mục */}
        <div className="info-card">
          <div className="card-header">
            <h3>Chọn Danh Mục</h3>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
            {allCategories.map((cat) => (
              <label key={cat.id_categories} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={categories.includes(cat.id_categories)}
                  onChange={() => handleCategoryChange(cat.id_categories)}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>

        {/* Khối upload hình ảnh */}
        <div className="info-card">
          <div className="card-header">
            <h3>Hình Ảnh (Cloudinary)</h3>
          </div>
          <div className="info-grid">
            <div className="form-group">
              <label className="info-label">Ảnh đại diện (Thumbnail - Chọn 1) *</label>
              <input
                className="form-control"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files[0])}
                required
              />
            </div>
            <div className="form-group">
              <label className="info-label">Ảnh phụ (Images - Tối đa 5 ảnh)</label>
              {/* Thuộc tính multiple cho phép quét chuột chọn nhiều file */}
              <input
                className="form-control"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(e.target.files)}
              />
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", marginTop: "20px" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "16px" }} disabled={loading}>
            {loading ? "⏳ Đang đẩy lên Cloud..." : "✅ Chốt Đơn! Thêm Sản Phẩm"}
          </button>
        </div>
      </form>
    </div>
  );
}