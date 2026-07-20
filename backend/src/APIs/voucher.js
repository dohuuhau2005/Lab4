const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');
const redisClient = require("../config/redisClient");
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
            time_exp,
            name,
            discount,
            type,
            voucher_status
        } = req.body;

        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        request.input("id_voucher", sql.VarChar(10), id_voucher);
        request.input("quantities", sql.Int, quantities);
        request.input("time_deploy", sql.DateTime, time_deploy);
        request.input("time_end", sql.DateTime, time_end);
        request.input("time_exp", sql.DateTime, time_exp);
        request.input("name", sql.NVarChar(30), name);
        request.input("discount", sql.Int, discount);
        request.input("type", sql.VarChar(20), type);
        request.input("voucher_status", sql.Int, voucher_status);

        const query = `
            INSERT INTO Voucher
            (
                id_voucher,
                quantities,
                time_deploy,
                time_end,
                time_exp,
                name,
                discount,
                type,
                voucher_status
            )
            VALUES
            (
                @id_voucher,
                @quantities,
                @time_deploy,
                @time_end,
                @time_exp,
                @name,
                @discount,
                @type,
                @voucher_status
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
            time_exp,
            name,
            discount,
            type,
            voucher_status
        } = req.body;

        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        request.input("id", sql.VarChar(10), req.params.id);
        request.input("quantities", sql.Int, quantities);
        request.input("time_deploy", sql.DateTime, time_deploy);
        request.input("time_end", sql.DateTime, time_end);
        request.input("time_exp", sql.DateTime, time_exp);
        request.input("name", sql.NVarChar(30), name);
        request.input("discount", sql.Int, discount);
        request.input("type", sql.VarChar(20), type);
        request.input("voucher_status", sql.Int, voucher_status);

        const query = `
            UPDATE Voucher
            SET
                quantities = @quantities,
                time_deploy = @time_deploy,
                time_end = @time_end,
                time_exp = @time_exp,
                name = @name,
                discount = @discount,
                type = @type,
                voucher_status = @voucher_status
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
            SET voucher_status = -1
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

router.post("/hunt-voucher", async (req, res) => {
    const { id_user, id_voucher } = req.body;
    const quantityKey = `Voucher:${id_voucher}:quantity`;
    const pool = await db.GetManh1DBPool();
    const query = `select count(*) from VoucherHunting where id_voucher = @id_voucher and id_user = @id_user`;
    const request = pool.request().input('id_voucher', sql.VarChar(10), id_voucher).input('id_user', sql.VarChar(26), id_user);
    const result = await request.query(query);
    if (result.recordset[0][''] > 0) {
        return res.status(400).json({ duplicate: true, message: "Bạn đã săn voucher này rồi!" });
    }
    // Script Lua: Kiểm tra tồn tại -> Kiểm tra > 0 -> Trừ 1 -> Trả về kết quả
    // Trả về 1 là ăn, 0 là hết, -1 là lỗi không thấy
    const luaScript = `
        local qty = redis.call('GET', KEYS[1])
        if qty then
            if tonumber(qty) > 0 then
                redis.call('DECR', KEYS[1])
                return 1
            else
                return 0
            end
        else
            return -1
        end
    `;

    try {
        // Thực thi Lua Script một cách nguyên tử (Atomic)
        const result = await redisClient.eval(luaScript, {
            keys: [quantityKey]
        });

        if (result === 1) {
            // ==========================================
            // THÀNH CÔNG: User đã cướp được 1 slot voucher!
            // ==========================================
            await require("../config/SeenMessage").send(id_user, id_voucher);

            console.log(`User ${id_user} săn thành công voucher ${id_voucher}`);
            return res.status(200).json({ message: "Săn voucher thành công!" });

        } else if (result === 0) {
            return res.status(400).json({ message: "Voucher đã hết số lượng!" });
        } else {
            return res.status(404).json({ message: "Voucher chưa được mở hoặc không tồn tại!" });
        }
    } catch (error) {
        console.error("Lỗi khi săn voucher:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
});
router.get("/active-vouchers", async (req, res) => {
    try {
        // 1. Quét tìm tất cả các key chứa info của voucher đang được deploy
        // Lệnh keys này sẽ trả về mảng dạng: ['Voucher:TET2024:info', 'Voucher:SALE50:info']
        const infoKeys = await redisClient.keys('Voucher:*:info');

        if (!infoKeys || infoKeys.length === 0) {
            return res.status(200).json({
                message: "Hiện chưa có voucher nào đang phát hành",
                vouchers: []
            });
        }

        // 2. Tự động sinh ra mảng các key chứa số lượng tương ứng
        // Biến 'Voucher:TET2024:info' thành 'Voucher:TET2024:quantity'
        const qtyKeys = infoKeys.map(key => key.replace(':info', ':quantity'));

        // 3. TUYỆT CHIÊU TỐI ƯU: Kéo dữ liệu từ Redis lên song song
        // mGet giúp gom nhiều key lấy 1 lần duy nhất, tốc độ bàn thờ
        const [infoValues, qtyValues] = await Promise.all([
            redisClient.mGet(infoKeys),
            redisClient.mGet(qtyKeys)
        ]);

        // 4. Lắp ráp dữ liệu lại để gửi về cho Frontend
        const vouchers = [];

        for (let i = 0; i < infoKeys.length; i++) {
            if (infoValues[i]) {
                const voucherData = JSON.parse(infoValues[i]);

                // Trọng tâm ở đây: Lấy số lượng real-time đè lên số lượng gốc
                const realtimeQty = qtyValues[i] !== null ? parseInt(qtyValues[i], 10) : 0;
                voucherData.quantities = realtimeQty; // Cập nhật lại số lượng mới nhất

                vouchers.push(voucherData);
            }
        }

        return res.status(200).json({
            message: "Lấy danh sách voucher thành công",
            vouchers: vouchers
        });

    } catch (error) {
        console.error("Lỗi khi get list voucher từ Redis:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
});
module.exports = router;