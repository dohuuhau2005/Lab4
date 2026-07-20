const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../config/DBConnection'); // Nhớ check lại đường dẫn file DB của bro nha

// ==========================================
// 1. GET - Lấy danh sách địa chỉ của 1 user
// ==========================================
router.get("/info/:id_user", async (req, res) => {
    try {
        const { id_user } = req.params;
        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        const query = `
            SELECT id_Info, id_user, address, phone, name 
            FROM InfoDelivery 
            WHERE id_user = @id_user
            ORDER BY id_Info DESC
        `;
        request.input("id_user", sql.VarChar(26), id_user);

        const result = await request.query(query);
        res.status(200).json({
            message: "Lấy thông tin giao hàng thành công",
            deliveryInfos: result.recordset
        });
    } catch (error) {
        console.error("Lỗi lấy thông tin giao hàng:", error);
        res.status(500).json({ message: "Lỗi server khi lấy thông tin" });
    }
});

// ==========================================
// 2. POST - Thêm địa chỉ mới
// ==========================================
router.post("/info", async (req, res) => {
    try {
        const { id_user, address, phone, name } = req.body;

        if (!id_user || !address || !phone || !name) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin!" });
        }

        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        const query = `
            INSERT INTO InfoDelivery (id_user, address, phone, name)
            VALUES (@id_user, @address, @phone, @name)
        `;

        request.input("id_user", sql.VarChar(26), id_user)
            .input("address", sql.NVarChar(255), address)
            .input("phone", sql.VarChar(10), phone)
            .input("name", sql.NVarChar(200), name);

        await request.query(query);
        res.status(201).json({ message: "Đã thêm địa chỉ giao hàng thành công" });
    } catch (error) {
        console.error("Lỗi thêm địa chỉ giao hàng:", error);
        res.status(500).json({ message: "Lỗi server khi thêm địa chỉ" });
    }
});

// ==========================================
// 3. PUT - Sửa địa chỉ (Dùng tuyệt chiêu COALESCE)
// ==========================================
router.put("/info/:id_Info", async (req, res) => {
    try {
        const { id_Info } = req.params;
        const { address, phone, name } = req.body;

        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        // Khách gửi trường nào lên thì update trường đó, không gửi thì giữ nguyên
        const query = `
            UPDATE InfoDelivery 
            SET 
                address = COALESCE(@address, address),
                phone   = COALESCE(@phone, phone),
                name    = COALESCE(@name, name)
            WHERE id_Info = @id_Info
        `;

        request.input("id_Info", sql.BigInt, parseInt(id_Info))
            .input("address", sql.NVarChar(255), address ? address : null)
            .input("phone", sql.VarChar(10), phone ? phone : null)
            .input("name", sql.NVarChar(200), name ? name : null);

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy địa chỉ để cập nhật" });
        }

        res.status(200).json({ message: `Cập nhật địa chỉ ${id_Info} thành công` });
    } catch (error) {
        console.error("Lỗi cập nhật địa chỉ giao hàng:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật" });
    }
});

// ==========================================
// 4. DELETE - Xóa địa chỉ
// ==========================================
router.delete("/info/:id_Info", async (req, res) => {
    try {
        const { id_Info } = req.params;

        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        const query = `DELETE FROM InfoDelivery WHERE id_Info = @id_Info`;
        request.input("id_Info", sql.BigInt, parseInt(id_Info));

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy địa chỉ để xóa" });
        }

        res.status(200).json({ message: `Xóa địa chỉ ${id_Info} thành công` });
    } catch (error) {
        console.error("Lỗi xóa địa chỉ giao hàng:", error);
        res.status(500).json({ message: "Lỗi server khi xóa" });
    }
});

module.exports = router;