const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');

/**
 * Thêm Voucher
 */
router.post("/voucher", async (req, res) => {
    try {
        const {
            id_voucher,
            quantities,
            time_deploy,
            time_end,
            name,
            discount,
            type,
            is_Locked
        } = req.body;

        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        request.input("id_voucher", sql.VarChar(10), id_voucher);
        request.input("quantities", sql.Int, quantities);
        request.input("time_deploy", sql.DateTime, time_deploy);
        request.input("time_end", sql.DateTime, time_end);
        request.input("name", sql.NVarChar(30), name);
        request.input("discount", sql.Int, discount);
        request.input("type", sql.VarChar(20), type);
        request.input("is_Locked", sql.Bit, is_Locked);

        const query = `
            INSERT INTO Voucher
            (
                id_voucher,
                quantities,
                time_deploy,
                time_end,
                name,
                discount,
                type,
                is_Locked
            )
            VALUES
            (
                @id_voucher,
                @quantities,
                @time_deploy,
                @time_end,
                @name,
                @discount,
                @type,
                @is_Locked
            )
        `;

        await request.query(query);

        res.status(200).json({
            message: "Thêm voucher thành công"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi thêm voucher"
        });
    }
});


/**
 * Lấy danh sách Voucher sai sai -------------------------------------
 */
router.get("/voucher", async (req, res) => {
    try {

        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        const query = `
            SELECT *
            FROM Voucher
            ORDER BY time_deploy DESC
        `;

        const result = await request.query(query);

        res.status(200).json({
            message: "Lấy danh sách voucher thành công",
            vouchers: result.recordset
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi lấy danh sách voucher"
        });
    }
});


/**
 * Cập nhật Voucher
 */
router.put("/voucher/:id", async (req, res) => {

    try {

        const {
            quantities,
            time_deploy,
            time_end,
            name,
            discount,
            type,
            is_Locked
        } = req.body;

        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        request.input("id", sql.VarChar(10), req.params.id);
        request.input("quantities", sql.Int, quantities);
        request.input("time_deploy", sql.DateTime, time_deploy);
        request.input("time_end", sql.DateTime, time_end);
        request.input("name", sql.NVarChar(30), name);
        request.input("discount", sql.Int, discount);
        request.input("type", sql.VarChar(20), type);
        request.input("is_Locked", sql.Bit, is_Locked);

        const query = `
            UPDATE Voucher
            SET
                quantities = @quantities,
                time_deploy = @time_deploy,
                time_end = @time_end,
                name = @name,
                discount = @discount,
                type = @type,
                is_Locked = @is_Locked
            WHERE id_voucher = @id
        `;

        await request.query(query);

        res.status(200).json({
            message: "Cập nhật voucher thành công"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi cập nhật voucher"
        });

    }

});


/**
 * Khóa Voucher
 */
router.delete("/voucher/:id", async (req, res) => {

    try {

        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        request.input("id", sql.VarChar(10), req.params.id);

        const query = `
            update Voucher
            SET is_Locked = 1
            WHERE id_voucher = @id
        `;

        await request.query(query);

        res.status(200).json({
            message: "khóa voucher thành công"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Lỗi khóa voucher"
        });

    }

});

module.exports = router;