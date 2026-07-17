import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProductAdminDetail.css"; // Nhớ import file CSS nha bro!

export default function ProductAdminDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);

  const [infoForm, setInfoForm] = useState({});
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const [selectedAddCategory, setSelectedAddCategory] = useState("");
  const [newImageFile, setNewImageFile] = useState(null);
  const [updateImageFile, setUpdateImageFile] = useState({});

  useEffect(() => {
    fetchProduct();
    fetchAllCategories();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:9999/admin/productsAdmin/${id}`);
      if (res.data && res.data.products && res.data.products[0]) {
        const prodData = res.data.products[0][0];
        setProduct(prodData);
        setInfoForm({
          name: prodData.name_product,
          price: prodData.new_price,
          description: prodData.description,
          quantities: prodData.quantities,
          meta_title: prodData.meta_title,
          weight: prodData.weight
        });
      }
    } catch (error) {
      alert("Không tìm thấy sản phẩm!");
      navigate("/admin/products");
    }
    setLoading(false);
  };

  const fetchAllCategories = async () => {
    try {
      const res = await axios.get("http://localhost:9999/admin/categories");
      if (res.data && res.data.categories) {
        setAllCategories(res.data.categories);
      }
    } catch (error) {
      console.error("Lỗi lấy danh mục", error);
    }
  };

  // Các hàm xử lý API giữ nguyên
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", infoForm.name);
    formData.append("price", infoForm.price);
    formData.append("description", infoForm.description);
    formData.append("quantities", infoForm.quantities);
    formData.append("meta_title", infoForm.meta_title);
    formData.append("weight", infoForm.weight);
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

    try {
      await axios.put(`http://localhost:9999/admin/product/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Cập nhật thông tin thành công!");
      setIsEditingInfo(false);
      fetchProduct();
    } catch (error) {
      alert("Lỗi cập nhật thông tin!");
    }
  };

  const handleAddCategory = async () => {
    if (!selectedAddCategory) return;
    try {
      await axios.post(`http://localhost:9999/admin/categoriesProduct/${id}`,
        { id_categories: selectedAddCategory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProduct();
    } catch (error) {
      alert("Lỗi thêm danh mục!");
    }
  };

  const handleRemoveCategory = async (id_categories) => {
    if (!window.confirm("Bạn muốn xóa danh mục này khỏi sản phẩm?")) return;
    try {
      await axios.delete(`http://localhost:9999/admin/categoriesProduct/${id}?id_categories=${id_categories}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProduct();
    } catch (error) {
      alert("Lỗi xóa danh mục!");
    }
  };

  const handleAddImage = async () => {
    if (!newImageFile) return;
    const formData = new FormData();
    formData.append("id_product", id);
    formData.append("NewImage", newImageFile);

    try {
      await axios.post(`http://localhost:9999/image/image`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewImageFile(null);
      fetchProduct();
    } catch (error) {
      alert("Lỗi thêm ảnh phụ!");
    }
  };

  const handleRemoveImage = async (imgId, imgUrl) => {
    if (!window.confirm("Bạn muốn xóa ảnh này?")) return;
    try {
      await axios.delete(`http://localhost:9999/image/image/${imgId}?oldThumbnailUrl=${encodeURIComponent(imgUrl)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProduct();
    } catch (error) {
      alert("Lỗi xóa ảnh!");
    }
  };

  const handleUpdateSingleImage = async (imgId, imgUrl) => {
    const file = updateImageFile[imgId];
    if (!file) {
      alert("Vui lòng chọn ảnh mới trước khi cập nhật!");
      return;
    }
    const formData = new FormData();
    formData.append("NewImage", file);

    try {
      await axios.put(`http://localhost:9999/image/image/${imgId}?oldThumbnailUrl=${encodeURIComponent(imgUrl)}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProduct();
    } catch (error) {
      alert("Lỗi cập nhật ảnh!");
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!product) return <div>Không tìm thấy sản phẩm!</div>;

  const listImgUrls = product.list_images ? product.list_images.split(",") : [];
  const listImgIds = product.List_id_img ? product.List_id_img.split(",") : [];
  const listCatNames = product.list_name_categories ? product.list_name_categories.split(",") : [];
  const listCatIds = product.list_id_categories ? product.list_id_categories.split(",") : [];

  return (
    <div className="admin-detail-container">
      <div className="header-section">
        <h2>Chi tiết sản phẩm #{product.id_product}</h2>
        <button className="btn btn-back" onClick={() => navigate("/admin/products")}>
          ⬅ Quay lại danh sách
        </button>
      </div>

      {/* KHỐI 1: THÔNG TIN SẢN PHẨM */}
      <div className="info-card">
        <div className="card-header">
          <h3>Thông tin cơ bản</h3>
          <button
            className={`btn ${isEditingInfo ? 'btn-outline' : 'btn-primary'}`}
            onClick={() => setIsEditingInfo(!isEditingInfo)}
          >
            {isEditingInfo ? "Hủy sửa" : "Thay đổi thông tin"}
          </button>
        </div>

        {!isEditingInfo ? (
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Tên sản phẩm</span>
              <span className="info-value">{product.name_product}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Giá mới</span>
              <span className="info-value" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                {product.new_price?.toLocaleString()} đ
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Khối lượng</span>
              <span className="info-value">{product.weight} g</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tồn kho</span>
              <span className="info-value">{product.quantities}</span>
            </div>
            <div className="info-item" style={{ gridColumn: '1 / -1' }}>
              <span className="info-label">Mô tả</span>
              <span className="info-value">{product.description}</span>
            </div>
            <div className="info-item" style={{ gridColumn: '1 / -1' }}>
              <span className="info-label">Ảnh đại diện</span>
              <img src={product.thumbnail} alt="thumb" style={{ width: '120px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '8px' }} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateInfo}>
            <div className="info-grid">
              <div className="form-group">
                <label className="info-label">Tên SP</label>
                <input className="form-control" value={infoForm.name} onChange={e => setInfoForm({ ...infoForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="info-label">Giá mới</label>
                <input className="form-control" type="number" value={infoForm.price} onChange={e => setInfoForm({ ...infoForm, price: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="info-label">Số lượng</label>
                <input className="form-control" type="number" value={infoForm.quantities} onChange={e => setInfoForm({ ...infoForm, quantities: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="info-label">Khối lượng (g)</label>
                <input className="form-control" type="number" value={infoForm.weight} onChange={e => setInfoForm({ ...infoForm, weight: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="info-label">Mô tả</label>
                <textarea className="form-control" rows="3" value={infoForm.description} onChange={e => setInfoForm({ ...infoForm, description: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="info-label">Đổi ảnh đại diện</label>
                <input className="form-control" type="file" onChange={e => setThumbnailFile(e.target.files[0])} accept="image/*" />
              </div>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary">Lưu Thông Tin</button>
            </div>
          </form>
        )}
      </div>

      {/* KHỐI 2: DANH MỤC SẢN PHẨM */}
      <div className="info-card">
        <div className="card-header">
          <h3>Loại sản phẩm (Categories)</h3>
          <button
            className={`btn ${isEditingCategory ? 'btn-outline' : 'btn-primary'}`}
            onClick={() => setIsEditingCategory(!isEditingCategory)}
          >
            {isEditingCategory ? "Đóng" : "Quản lý Danh mục"}
          </button>
        </div>

        <div>
          {listCatNames.map((catName, idx) => (
            <span key={idx} className="category-tag">
              {catName}
              {isEditingCategory && (
                <button className="btn-remove" onClick={() => handleRemoveCategory(listCatIds[idx])}>✕</button>
              )}
            </span>
          ))}
        </div>

        {isEditingCategory && (
          <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px dashed #cbd5e1", display: 'flex', gap: '12px' }}>
            <select className="form-control" style={{ maxWidth: '300px' }} onChange={(e) => setSelectedAddCategory(e.target.value)} defaultValue="">
              <option value="" disabled>-- Chọn danh mục để thêm --</option>
              {allCategories.map(cat => (
                <option key={cat.id_categories} value={cat.id_categories}>{cat.name}</option>
              ))}
            </select>
            <button className="btn btn-success" onClick={handleAddCategory}>+ Thêm Loại</button>
          </div>
        )}
      </div>

      {/* KHỐI 3: HÌNH ẢNH PHỤ */}
      <div className="info-card">
        <div className="card-header">
          <h3>Ảnh phụ</h3>
          <button
            className={`btn ${isEditingImage ? 'btn-outline' : 'btn-primary'}`}
            onClick={() => setIsEditingImage(!isEditingImage)}
          >
            {isEditingImage ? "Đóng" : "Quản lý Ảnh phụ"}
          </button>
        </div>

        <div className="image-gallery">
          {listImgUrls.map((imgUrl, idx) => {
            const imgId = listImgIds[idx];
            return (
              <div key={idx} className="image-card">
                <img src={imgUrl} alt="phụ" />

                {isEditingImage && (
                  <div className="image-actions">
                    <button className="btn btn-danger" onClick={() => handleRemoveImage(imgId, imgUrl)} style={{ width: '100%' }}>Xóa Ảnh</button>
                    <input className="form-control" type="file" style={{ padding: '6px' }}
                      onChange={e => setUpdateImageFile({ ...updateImageFile, [imgId]: e.target.files[0] })}
                    />
                    <button className="btn btn-outline" onClick={() => handleUpdateSingleImage(imgId, imgUrl)}>Cập nhật</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isEditingImage && (
          <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px dashed #cbd5e1" }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Thêm ảnh phụ mới</h4>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input className="form-control" type="file" style={{ maxWidth: '300px' }} onChange={e => setNewImageFile(e.target.files[0])} />
              <button className="btn btn-success" onClick={handleAddImage}>+ Upload Thêm Ảnh</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}