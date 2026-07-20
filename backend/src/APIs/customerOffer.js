const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');
const redisClient = require("../config/redisClient");
router.get("/chooseOffer", async (req, res) => {

    try {
        const { TotalWeight, IsInternal } = req.query;
        const pool = await db.GetManh1DBPool();
        const query = `sp_GetDeliveryOptions @TotalWeight=@TotalWeight, @IsInternal=@IsInternal`;
        const result = await pool.request()
            .input('TotalWeight', sql.Decimal(10, 2), req.query.TotalWeight)
            .input('IsInternal', sql.Bit, req.query.IsInternal)
            .query(query);
        res.json({ offers: result.recordset });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách offer:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
});
module.exports = router;