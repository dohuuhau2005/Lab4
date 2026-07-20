const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../config/DBConnection'); // Nhớ chỉnh lại đường dẫn cho đúng nha bro

// ==========================================
// 1. GET - Lấy danh sách lịch sử đơn hàng
// ==========================================
router.get("/history/:id_user", async (req, res) => {
    try {
        const { id_user } = req.params;
        const pool = await db.GetManh1DBPool();

        // Bước 1: Kéo thông tin Đơn hàng và Thanh toán
        const orderQuery = `
            SELECT o.id_order, o.total_price, o.status AS order_status, 
                   o.address, o.phone, o.name,
                   p.type AS payment_type, p.id_payment, p.status AS payment_status
            FROM [Order] o
            INNER JOIN payment p ON o.id_order = p.id_order
            WHERE o.id_user = @id_user
            ORDER BY o.id_order DESC
        `;
        const orderResult = await pool.request()
            .input('id_user', sql.VarChar(26), id_user)
            .query(orderQuery);

        // Bước 2: Kéo luôn chi tiết sản phẩm của các đơn hàng đó
        const detailQuery = `
            SELECT id_order, name_product, img1, price, measure
            FROM Order_details
            WHERE id_user = @id_user
        `;
        const detailResult = await pool.request()
            .input('id_user', sql.VarChar(26), id_user)
            .query(detailQuery);

        // Bước 3: Lắp ráp Data (Map mảng details vào đúng mảng orders)
        const formattedOrders = orderResult.recordset.map(order => ({
            ...order,
            items: detailResult.recordset.filter(d => d.id_order === order.id_order)
        }));

        res.status(200).json({ success: true, orders: formattedOrders });

    } catch (error) {
        console.error("Lỗi lấy lịch sử:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});

// ==========================================
// 2. PUT - Hủy đơn hàng (Trạng thái 0 và 1) + Lưu lý do
// ==========================================
router.put("/cancel/:id_order", async (req, res) => {
    try {
        const { id_order } = req.params;
        const { id_user, reason } = req.body;
        const pool = await db.GetManh1DBPool();

        // Chỉ cho phép hủy khi status IN (0, 1)
        const query = `
            UPDATE o
            SET o.status = -1, o.cancel_reason = @reason
            FROM [Order] o
            WHERE o.id_order = @id_order 
              AND o.id_user = @id_user 
              AND o.status IN (0, 1)
        `;

        const result = await pool.request()
            .input('id_order', sql.Int, id_order)
            .input('id_user', sql.VarChar(26), id_user)
            .input('reason', sql.NVarChar(255), reason)
            .query(query);

        if (result.rowsAffected[0] > 0) {
            const orderInfoRes = await pool.request()
                .input('id_order', sql.Int, id_order)
                .query(`SELECT id_user, id_voucher FROM [Order] WHERE id_order = @id_order`);

            if (orderInfoRes.recordset.length > 0) {
                const { id_user, id_voucher } = orderInfoRes.recordset[0];

                // Chỉ xử lý nếu đơn hàng này có xài voucher


                // NẾU HỦY ĐƠN: Hoàn lại voucher (Active = 1)
                await pool.request()
                    .input('id_voucher', sql.VarChar(50), id_voucher)
                    .input('id_user', sql.VarChar(26), id_user)
                    .query(`UPDATE VoucherHunting SET Active = 1 WHERE id_voucher = @id_voucher AND id_user = @id_user`);



            }
        }
        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ success: true, message: "Đã hủy đơn hàng thành công" });
        } else {
            res.status(400).json({ success: false, message: "Đơn hàng đang giao không thể hủy!" });
        }
    } catch (error) {
        console.error("Lỗi hủy đơn:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});

// ==========================================
// 3. PUT - Cập nhật địa chỉ (Trạng thái 0, 1, 2)
// ==========================================
router.put("/update-address/:id_order", async (req, res) => {
    try {
        const { id_order } = req.params;
        const { id_user, name, phone, address } = req.body;
        const pool = await db.GetManh1DBPool();

        // MỞ KHÓA THÊM TRẠNG THÁI 0 (Chờ xác nhận)
        const query = `
            UPDATE [Order]
            SET name = @name, phone = @phone, address = @address
            WHERE id_order = @id_order 
              AND id_user = @id_user 
              AND status IN (0, 1, 2) 
        `;

        const result = await pool.request()
            .input('id_order', sql.Int, id_order)
            .input('id_user', sql.VarChar(26), id_user)
            .input('name', sql.NVarChar(200), name)
            .input('phone', sql.VarChar(10), phone)
            .input('address', sql.NVarChar(255), address)
            .query(query);

        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ success: true, message: "Đã cập nhật địa chỉ giao hàng!" });
        } else {
            res.status(400).json({ success: false, message: "Không thể đổi địa chỉ lúc này!" });
        }
    } catch (error) {
        console.error("Lỗi đổi địa chỉ:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});

module.exports = router;