const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');
const redisClient = require("../config/redisClient");
router.get("/Vouchers/:id_user", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const query = `SELECT v.discount,v.name,v.time_exp,v.id_voucher,v.type  FROM VoucherHunting join Voucher v on v.id_voucher= VoucherHunting.id_voucher WHERE id_user = @id_user and VoucherHunting.Active=1`;
        const result = await pool.request().input('id_user', sql.VarChar(26), req.params.id_user).query(query);
        res.json({ vouchers: result.recordset });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách voucher:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;
