import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Thêm Import này
import "./ProductList.css";

// Hàm tạo Slug từ tên sản phẩm
const generateSlug = (str) => {
    if (!str) return "";
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, "-");
};



// ... bên trong component của bạn

const handleAddToCart = async (e, id_product) => {
    e.preventDefault(); // Ngăn Link chuyển trang khi bấm nút

    // 1. Lấy thông tin user từ localStorage
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;

    // Tùy thuộc vào tên key ID trong object user của bạn (VD: user.id, user.UserId, user.ID...)
    const id_user = user?.id || user?.UserId;

    // Kiểm tra xem đã đăng nhập chưa
    if (!id_user) {
        alert("Vui lòng đăng nhập để mua hàng!");
        // window.location.href = "/login"; // Có thể chuyển hướng đến trang login nếu muốn
        return;
    }

    // 2. Gọi API thêm vào giỏ hàng
    try {
        const response = await axios.post("http://localhost:9999/customer/cart", {
            id_user: id_user,
            id_product: id_product,
            quantities: 1 // Mặc định mỗi lần bấm là thêm 1 sản phẩm
        });

        if (response.status === 200 || response.status === 201) {
            alert("Đã thêm vào giỏ hàng thành công! 🛒");
            // Gợi ý: Nếu có state quản lý số lượng giỏ hàng trên Header, bạn có thể gọi hàm update ở đây
        }
    } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);
        alert("Thêm vào giỏ hàng thất bại. Vui lòng thử lại!");
    }
};
export default function ProductList() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);

    // States cho bộ lọc
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [minQuantity, setMinQuantity] = useState("");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get("http://localhost:9999/cache/categories");
                if (res.data && res.data.categories) {
                    setCategories(res.data.categories);
                }
            } catch (error) {
                console.error("Lỗi lấy danh mục:", error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                let url = "http://localhost:9999/cache/products/all";
                if (selectedCategory !== "all") {
                    url = `http://localhost:9999/cache/products/category/${selectedCategory}`;
                }
                const res = await axios.get(url);
                if (res.data && res.data.data) {
                    setProducts(res.data.data);
                } else if (Array.isArray(res.data)) {
                    setProducts(res.data);
                } else {
                    setProducts([]);
                }
            } catch (error) {
                console.error("Lỗi lấy sản phẩm:", error);
                setProducts([]);
            }
        };
        fetchProducts();
    }, [selectedCategory]);

    const filteredProducts = products.filter(item => {
        const matchName = item.name_product.toLowerCase().includes(searchKeyword.toLowerCase());
        const itemPrice = item.new_price || 0;
        const matchMinPrice = minPrice === "" || itemPrice >= parseInt(minPrice);
        const matchMaxPrice = maxPrice === "" || itemPrice <= parseInt(maxPrice);
        const itemQty = item.quantities || 0;
        const matchMinQty = minQuantity === "" || itemQty >= parseInt(minQuantity);
        return matchName && matchMinPrice && matchMaxPrice && matchMinQty;
    });

    return (
        <div className="product-page">
            <aside className="sidebar-filter">
                {/* Giữ nguyên Sidebar như cũ */}
                <h3 className="filter-title">📑 Danh mục</h3>
                <ul className="category-list">
                    <li className={selectedCategory === "all" ? "active" : ""} onClick={() => setSelectedCategory("all")}>
                        Tất cả sản phẩm
                    </li>
                    {categories.map(cat => (
                        <li key={cat.id_categories} className={selectedCategory === cat.id_categories ? "active" : ""} onClick={() => setSelectedCategory(cat.id_categories)}>
                            {cat.name}
                        </li>
                    ))}
                </ul>
                <div className="divider"></div>
                <h3 className="filter-title">💰 Khoảng giá</h3>
                <div className="price-filter">
                    <input type="number" placeholder="Từ (đ)" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                    <span> - </span>
                    <input type="number" placeholder="Đến (đ)" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                </div>
                <div className="divider"></div>
                <h3 className="filter-title">📦 Số lượng còn</h3>
                <div className="qty-filter">
                    <input type="number" placeholder="Ít nhất" value={minQuantity} onChange={e => setMinQuantity(e.target.value)} />
                </div>
            </aside>

            <div className="main-content">
                <div className="search-bar">
                    <input type="text" placeholder="🔍 Bạn đang tìm sản phẩm gì..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} />
                </div>

                <div className="product-grid">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => {
                            // Tạo slug từ tên
                            const slug = generateSlug(product.name_product);

                            return (
                                /* ĐỔI div THÀNH Link ĐỂ CHUYỂN TRANG */
                                <Link
                                    to={`product/${slug}.${product.id_product}`}
                                    className="product-card"
                                    key={product.id_product}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div className="product-img-wrapper">
                                        <img src={product.thumbnail} alt={product.name_product} />
                                    </div>
                                    <div className="product-info">
                                        <h4 className="product-name">{product.name_product}</h4>
                                        <div className="product-price-row">
                                            <span className="new-price">{Number(product.new_price).toLocaleString("vi-VN")}đ</span>
                                            {product.old_price && (
                                                <span className="old-price">{Number(product.old_price).toLocaleString("vi-VN")}đ</span>
                                            )}
                                        </div>
                                        <div className="product-footer">
                                            <span className="product-qty">Kho: {product.quantities}</span>
                                            <button
                                                className="btn-add-cart"
                                                onClick={(e) => {
                                                    handleAddToCart(e, product.id_product); // Ngăn Link chuyển trang khi bấm nút Thêm giỏ hàng
                                                }}
                                            >
                                                Thêm 🛒
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                        <div className="no-products">
                            <p>Opps! Không tìm thấy sản phẩm nào khớp với tiêu chí của bạn 😢</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}