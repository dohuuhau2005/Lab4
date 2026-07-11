import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ProductDetail.css";

export default function ProductDetail() {
    const { slugId } = useParams(); // Lấy cục "ao-2-day.4" từ URL

    const [product, setProduct] = useState(null);
    const [mainImage, setMainImage] = useState("");
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);

    // Bóc tách lấy ID (phần tử sau dấu chấm cuối cùng)
    const idArray = slugId?.split(".") || [];
    const productId = idArray[idArray.length - 1];

    useEffect(() => {
        const fetchProductDetail = async () => {
            try {
                const res = await axios.get(`http://localhost:9999/admin/products/${productId}`);

                // Dựa theo JSON bạn cung cấp, data nằm ở: res.data.products[0][0]
                if (res.data && res.data.products && res.data.products[0]) {
                    const data = res.data.products[0][0];
                    setProduct(data);

                    // Set hình ảnh chính mặc định là thumbnail
                    setMainImage(data.thumbnail);

                    // Tách list_images thành mảng các URL (nếu có)
                    if (data.list_images) {
                        const imageArray = data.list_images.split(",");
                        // Đưa luôn cả thumbnail vào đầu mảng gallery để làm bộ sưu tập
                        setGallery([data.thumbnail, ...imageArray]);
                    } else {
                        setGallery([data.thumbnail]);
                    }
                }
            } catch (error) {
                console.error("Lỗi gọi chi tiết sản phẩm:", error);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProductDetail();
        }
    }, [productId]);

    if (loading) return <div className="loading">Đang tải thông tin sản phẩm...</div>;
    if (!product) return <div className="error">Không tìm thấy sản phẩm!</div>;

    return (
        <div className="product-detail-container">
            <div className="detail-wrapper">

                {/* CỘT TRÁI: HÌNH ẢNH */}
                <div className="detail-gallery">
                    <div className="main-image-box">
                        <img src={mainImage} alt={product.name_product} />
                    </div>
                    <div className="thumbnail-list">
                        {gallery.map((imgUrl, index) => (
                            <div
                                key={index}
                                className={`thumb-item ${mainImage === imgUrl ? 'active' : ''}`}
                                onMouseEnter={() => setMainImage(imgUrl)} // Rê chuột hoặc click vào để đổi ảnh chính
                                onClick={() => setMainImage(imgUrl)}
                            >
                                <img src={imgUrl} alt={`thumb-${index}`} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* CỘT PHẢI: THÔNG TIN SẢN PHẨM */}
                <div className="detail-info">
                    <span className="meta-title">{product.meta_title}</span>
                    <h1 className="detail-name">{product.name_product}</h1>

                    <div className="detail-price-box">
                        <span className="current-price">{Number(product.new_price).toLocaleString("vi-VN")} đ</span>
                        {product.old_price && (
                            <span className="original-price">{Number(product.old_price).toLocaleString("vi-VN")} đ</span>
                        )}
                    </div>

                    <div className="detail-description">
                        <h3>Mô tả sản phẩm:</h3>
                        <p>{product.description}</p>
                    </div>

                    <div className="detail-status">
                        <p>Tình trạng:
                            <span className={product.status === 1 ? "in-stock" : "out-of-stock"}>
                                {product.status === 1 ? " Còn hàng" : " Hết hàng"}
                            </span>
                        </p>
                        <p>Số lượng trong kho: <strong>{product.quantities}</strong></p>
                    </div>

                    <div className="detail-actions">
                        <button className="btn-buy-now">Mua ngay</button>
                        <button className="btn-add-to-cart">Thêm vào giỏ hàng</button>
                    </div>
                </div>

            </div>
        </div>
    );
}