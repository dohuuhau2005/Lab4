import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PriceTable.css"; // Đảm bảo import file CSS mới nhé!

export default function PriceTable() {
  const [data, setData] = useState([]);
  const [preview, setPreview] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // States cho bộ lọc tìm kiếm
  const [searchName, setSearchName] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);

  // States cho giảm giá, ngày áp dụng và chọn sản phẩm
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [applyDate, setApplyDate] = useState("");

  // States cho Edit Lịch sử
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ dayApply: "", nowPrice: "", newPrice: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCategories();
    fetchData();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:9999/admin/categories", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
    }
  };

  const fetchData = async () => {
    try {
      let queryParams = [];
      if (searchName) queryParams.push(`name=${encodeURIComponent(searchName)}`);
      if (minPrice) queryParams.push(`minPrice=${minPrice}`);
      if (maxPrice) queryParams.push(`maxPrice=${maxPrice}`);
      if (categoryId) queryParams.push(`listcategories=${categoryId}`);

      const url = queryParams.length > 0
        ? `http://localhost:9999/price/pricetable/sort?${queryParams.join('&')}`
        : "http://localhost:9999/admin/TablePriceProducts";

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setData(res.data.products?.[0] || []);
      setPreview([]);
      setSelectedProducts([]);
    } catch (error) {
      console.error("Lỗi lấy danh sách sản phẩm:", error);
    }
  };

  const handleSearchClick = () => {
    fetchData();
  };

  const handleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(data.map(row => row.id_product));
    } else {
      setSelectedProducts([]);
    }
  };

  const handlePreview = (e) => {
    if (e.key !== "Enter") return;
    if (selectedProducts.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để áp dụng giảm giá!");
      return;
    }

    let val = parseFloat(discount);
    if (isNaN(val)) return;

    let newPreview = data.map(row => {
      if (selectedProducts.includes(row.id_product)) {
        let calculated_price = discountType === "percent"
          ? Math.round(row.new_price * (1 - val / 100))
          : Math.max(0, row.new_price - val);
        return { ...row, preview_price: calculated_price };
      }
      return row;
    });
    setPreview(newPreview);
  };

  const handleApply = async () => {
    if (!applyDate) {
      alert("Vui lòng chọn ngày áp dụng!");
      return;
    }

    const itemsToApply = preview.filter(row => selectedProducts.includes(row.id_product) && row.preview_price !== undefined);

    if (!itemsToApply.length) {
      alert("Chưa có sản phẩm nào được chọn hoặc chưa nhấn Enter để tính giá xem trước!");
      return;
    }

    const targetApplyDate = new Date(applyDate);
    targetApplyDate.setHours(12, 0, 0, 0);
    const currentSetDate = new Date();

    try {
      await axios.post("http://localhost:9999/price/pricetable", {
        listObjects: itemsToApply.map(row => ({
          day_apply: targetApplyDate,
          day_set: currentSetDate,
          now_price: row.new_price,
          new_price: row.preview_price,
          id_product: row.id_product
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Áp dụng thành công!");
      fetchData();
      setDiscount("");
      setApplyDate("");
    } catch (error) {
      console.error("Lỗi cập nhật giá:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:9999/price/pricetable", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data.pricetable?.[0] || []);
      setShowHistory(true);
    } catch (error) {
      console.error("Lỗi xem lịch sử:", error);
    }
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) return;
    try {
      await axios.delete(`http://localhost:9999/price/pricetable/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Xóa thành công!");
      fetchHistory();
    } catch (error) {
      console.error("Lỗi xóa:", error);
    }
  };

  const handleEditClick = (row) => {
    const rowId = row.id || row.id_table;
    setEditingId(rowId);
    const dateFormatted = new Date(row.day_apply).toISOString().split('T')[0];
    setEditForm({
      dayApply: dateFormatted,
      nowPrice: row.now_price,
      newPrice: row.new_price
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      await axios.put(`http://localhost:9999/price/pricetable/${id}`, {
        dayApply: editForm.dayApply,
        nowPrice: editForm.nowPrice,
        newPrice: editForm.newPrice
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Cập nhật thành công!");
      setEditingId(null);
      fetchHistory();
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
    }
  };

  return (
    <div className="price-container">
      <div className="price-header">
        <h2>Bảng Giá & Chương Trình Giảm Giá</h2>
      </div>

      {/* KHUNG TÌM KIẾM */}
      <div className="price-card">
        <h4 className="card-title">🔍 Bộ lọc tìm kiếm nâng cao</h4>
        <div className="filter-grid">
          <div className="input-group">
            <label>Tên sản phẩm</label>
            <input type="text" value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Nhập tên sản phẩm..." />
          </div>
          <div className="input-group">
            <label>Giá tối thiểu</label>
            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Giá tối thiểu (Min)" />
          </div>
          <div className="input-group">
            <label>Giá tối đa</label>
            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Giá tối đa (Max)" />
          </div>
          <div className="input-group">
            <label>Danh mục</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">-- Tất cả danh mục --</option>
              {categories.map(cat => (
                <option key={cat.id_categories} value={cat.id_categories}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="input-group btn-search-wrapper">
            <button className="btn-search" onClick={handleSearchClick}>Tìm kiếm</button>
          </div>
        </div>
      </div>

      {/* KHUNG ÁP DỤNG GIẢM GIÁ */}
      <div className="price-card highlight-card">
        <h4 className="card-title">⚡ Công cụ cấu hình giảm giá hàng loạt</h4>
        <p className="card-subtitle">* Chọn các sản phẩm dưới bảng, nhập mức giảm rồi nhấn <strong>Enter</strong> để xem trước giá mới.</p>
        <div className="action-grid">
          <div className="input-group-row">
            <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="select-compact">
              <option value="percent">% Giảm giá</option>
              <option value="amount">Giảm số tiền cố định</option>
            </select>
            <input
              type="number"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              onKeyDown={handlePreview}
              placeholder={discountType === "percent" ? "Nhập số % + Nhấn Enter" : "Nhập số tiền + Nhấn Enter"}
              className="input-main"
            />
          </div>

          <div className="input-group">
            <label>Ngày bắt đầu áp dụng mới</label>
            <input
              type="date"
              value={applyDate}
              onChange={e => setApplyDate(e.target.value)}
            />
          </div>

          <div className="action-buttons-group">
            <button className="btn-apply-now" onClick={handleApply}>🔥 Áp dụng (Apply)</button>
            <button className="btn-view-history" onClick={fetchHistory}>🕒 Xem lịch sử thay đổi</button>
          </div>
        </div>
      </div>

      {/* BẢNG SẢN PHẨM */}
      <div className="price-card no-padding">
        <div className="table-responsive">
          <table className="main-price-table">
            <thead>
              <tr>
                <th width="5%">
                  <input type="checkbox" onChange={handleSelectAll} checked={data.length > 0 && selectedProducts.length === data.length} />
                </th>
                <th width="8%">ID</th>
                <th>Tên sản phẩm</th>
                <th width="10%">Số lượng</th>
                <th width="12%">Hình ảnh</th>
                <th width="15%">Giá gốc hiện tại</th>
                <th width="18%">Giá mới dự kiến (Preview)</th>
              </tr>
            </thead>
            <tbody>
              {(preview.length ? preview : data).map(row => (
                <tr key={row.id_table || row.id_product} className={selectedProducts.includes(row.id_product) ? "row-selected" : ""}>
                  <td>
                    <input type="checkbox" checked={selectedProducts.includes(row.id_product)} onChange={() => handleSelectProduct(row.id_product)} />
                  </td>
                  <td><span className="badge-id">#{row.id_product}</span></td>
                  <td><strong>{row.name_product}</strong></td>
                  <td>{row.quantities}</td>
                  <td>
                    <div className="thumbnail-container">
                      <img src={row.thumbnail} alt="product" />
                    </div>
                  </td>
                  <td><span className="current-price-text">{Number(row.new_price).toLocaleString("vi-VN")} đ</span></td>
                  <td>
                    {row.preview_price ? (
                      <span className="preview-price-badge">
                        {Number(row.preview_price).toLocaleString("vi-VN")} đ
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-row">Không tìm thấy sản phẩm nào khớp bộ lọc.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LỊCH SỬ BẢNG GIÁ */}
      {showHistory && (
        <div className="price-card history-section animate-up">
          <div className="history-header">
            <h3>📋 Nhật ký cập nhật bảng giá</h3>
            <button className="btn-close-history" onClick={() => setShowHistory(false)}>Đóng x</button>
          </div>

          <div className="table-responsive">
            <table className="history-price-table">
              <thead>
                <tr>
                  <th>ID SP</th>
                  <th>Tên sản phẩm</th>
                  <th>Thời gian áp dụng</th>
                  <th>Giá cũ</th>
                  <th>Giá mới</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {history.map(row => {
                  const rowId = row.id || row.id_table;
                  const isEditing = editingId === rowId;

                  return (
                    <tr key={rowId}>
                      <td><span className="badge-id">#{row.id_product}</span></td>
                      <td>{row.name_product}</td>

                      {isEditing ? (
                        <>
                          <td>
                            <input type="date" className="input-inline" value={editForm.dayApply} onChange={e => setEditForm({ ...editForm, dayApply: e.target.value })} />
                          </td>
                          <td>
                            <input type="number" className="input-inline inline-price" value={editForm.nowPrice} onChange={e => setEditForm({ ...editForm, nowPrice: e.target.value })} />
                          </td>
                          <td>
                            <input type="number" className="input-inline inline-price" value={editForm.newPrice} onChange={e => setEditForm({ ...editForm, newPrice: e.target.value })} />
                          </td>
                          <td>
                            <div className="inline-actions">
                              <button className="btn-save-inline" onClick={() => handleSaveEdit(rowId)}>Lưu</button>
                              <button className="btn-cancel-inline" onClick={() => setEditingId(null)}>Hủy</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td><span className="time-text">{new Date(row.day_apply).toLocaleString("vi-VN")}</span></td>
                          <td><span className="price-old-striked">{Number(row.now_price).toLocaleString("vi-VN")} đ</span></td>
                          <td><span className="price-new-green">{Number(row.new_price).toLocaleString("vi-VN")} đ</span></td>
                          <td>
                            <div className="inline-actions">
                              <button className="btn-edit-inline" onClick={() => handleEditClick(row)}>Sửa</button>
                              <button className="btn-delete-inline" onClick={() => handleDeleteHistory(rowId)}>Xóa</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {history.length === 0 && (
                  <tr><td colSpan="6" className="empty-row">Chưa có dữ liệu nhật ký lịch sử thay đổi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}