// Hàm chuyển "Áo sát nách" thành "ao-sat-nach"
const generateSlug = (str) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD") // Tách dấu ra khỏi chữ
        .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
        .replace(/đ/g, "d").replace(/Đ/g, "D") // Đổi chữ đ
        .replace(/[^a-z0-9 ]/g, "") // Xóa ký tự đặc biệt
        .trim()
        .replace(/\s+/g, "-"); // Thay khoảng trắng bằng dấu gạch ngang
};