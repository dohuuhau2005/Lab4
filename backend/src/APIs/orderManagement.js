const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../config/DBConnection');

// ==========================================
// 1. ADMIN - Lấy tất cả đơn hàng
// ==========================================
router.get("/admin/all", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const orderQuery = `
            SELECT o.*, p.type AS payment_type, p.id_payment, p.status AS payment_status
            FROM [Order] o
            LEFT JOIN payment p ON o.id_order = p.id_order
            ORDER BY o.id_order DESC
        `;
        const orderResult = await pool.request().query(orderQuery);

        const detailQuery = `SELECT * FROM Order_details`;
        const detailResult = await pool.request().query(detailQuery);

        const formattedOrders = orderResult.recordset.map(order => ({
            ...order,
            items: detailResult.recordset.filter(d => d.id_order === order.id_order)
        }));

        res.status(200).json({ success: true, orders: formattedOrders });
    } catch (error) {
        console.error("Lỗi Admin lấy đơn:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});

// ==========================================
// 2. DELIVERY - Lấy đơn hàng theo id_delivery_system
// ==========================================
router.get("/delivery/:id_delivery_system", async (req, res) => {
    try {
        const { id_delivery_system } = req.params;
        const pool = await db.GetManh1DBPool();

        // CHỈ QUERY RA CÁC ĐƠN THUỘC VỀ ID VẬN CHUYỂN NÀY
        const orderQuery = `
            SELECT o.*, p.type AS payment_type, p.id_payment, p.status AS payment_status
            FROM [Order] o
            LEFT JOIN payment p ON o.id_order = p.id_order
            WHERE o.id_delivery_system = @id_delivery_system and o.status =2
            ORDER BY o.id_order DESC
        `;
        const orderResult = await pool.request()
            .input('id_delivery_system', sql.Int, parseInt(id_delivery_system))
            .query(orderQuery);

        const detailQuery = `
            SELECT d.* 
            FROM Order_details d
            INNER JOIN [Order] o ON d.id_order = o.id_order
            WHERE o.id_delivery_system = @id_delivery_system
        `;
        const detailResult = await pool.request()
            .input('id_delivery_system', sql.Int, parseInt(id_delivery_system))
            .query(detailQuery);

        const formattedOrders = orderResult.recordset.map(order => ({
            ...order,
            items: detailResult.recordset.filter(d => d.id_order === order.id_order)
        }));

        res.status(200).json({ success: true, orders: formattedOrders });
    } catch (error) {
        console.error("Lỗi Delivery lấy đơn:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});

// ==========================================
// 3. API DÙNG CHUNG - Cập nhật trạng thái
// ==========================================
router.put("/update-status/:id_order", async (req, res) => {
    try {
        const { id_order } = req.params;
        const { status } = req.body;
        const pool = await db.GetManh1DBPool();

        const query = `UPDATE [Order] SET status = @status WHERE id_order = @id_order`;
        const result = await pool.request()
            .input('status', sql.Int, status)
            .input('id_order', sql.Int, id_order)
            .query(query);

        const orderInfoRes = await pool.request()
            .input('id_order', sql.Int, id_order)
            .query(`SELECT id_user, id_voucher FROM [Order] WHERE id_order = @id_order`);

        if (orderInfoRes.recordset.length > 0) {
            const { id_user, id_voucher } = orderInfoRes.recordset[0];

            // Chỉ xử lý nếu đơn hàng này có xài voucher
            if (id_voucher) {
                if (status === -1) {
                    // NẾU HỦY ĐƠN: Hoàn lại voucher (Active = 1)
                    await pool.request()
                        .input('id_voucher', sql.VarChar(50), id_voucher)
                        .input('id_user', sql.VarChar(26), id_user)
                        .query(`UPDATE VoucherHunting SET Active = 1 WHERE id_voucher = @id_voucher AND id_user = @id_user`);

                } else if (status === 3) {
                    // NẾU GIAO THÀNH CÔNG: Xóa voucher khỏi ví của user luôn
                    await pool.request()
                        .input('id_voucher', sql.VarChar(50), id_voucher)
                        .input('id_user', sql.VarChar(26), id_user)
                        .query(`DELETE FROM VoucherHunting WHERE id_voucher = @id_voucher AND id_user = @id_user`);
                }
            }
        }


        if (result.rowsAffected[0] > 0) res.status(200).json({ success: true });
        else res.status(400).json({ success: false });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;