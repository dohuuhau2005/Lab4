const cron = require('node-cron');
const sql = require('mssql');
const db = require('../config/DBConnection');
const redisClient = require("../config/redisClient");

// Chạy mỗi phút 1 lần
const deployVoucherJob = cron.schedule('* * * * *', async () => {
    try {
        const pool = await db.GetManh1DBPool();

        // 1. Lấy thêm time_end để tính TTL
        const result = await pool.request().query(`
            SELECT id_voucher, quantities, name, discount, type, time_end 
            FROM Voucher 
            WHERE voucher_status = 0 AND time_deploy <= GETDATE()
        `);

        const pendingVouchers = result.recordset;

        if (pendingVouchers.length > 0) {
            for (const voucher of pendingVouchers) {
                const id = voucher.id_voucher;

                // TÍNH TOÁN TTL (Quy ra giây cho Redis)
                const timeEndMs = new Date(voucher.time_end).getTime();
                const nowMs = Date.now();
                const ttlSeconds = Math.floor((timeEndMs - nowMs) / 1000);

                // Chỉ quăng lên Redis nếu thời gian kết thúc vẫn còn ở tương lai
                if (ttlSeconds > 0) {
                    // 2. Set key info (Tự hủy sau TTL)
                    await redisClient.set(
                        `Voucher:${id}:info`,
                        JSON.stringify(voucher),
                        { EX: ttlSeconds }
                    );

                    // 3. Set key quantity (Tự hủy sau TTL)
                    await redisClient.set(
                        `Voucher:${id}:quantity`,
                        voucher.quantities,
                        { EX: ttlSeconds }
                    );

                    // 4. Update DB thành 1 (Đã deploy)
                    await pool.request()
                        .input('id', sql.VarChar(10), id)
                        .query(`UPDATE Voucher SET voucher_status = 1 WHERE id_voucher = @id`);

                    console.log(`Đã deploy voucher ${id} - Sẽ bốc hơi khỏi Redis sau ${ttlSeconds} giây`);
                } else {
                    // XỬ LÝ RÁC: Nếu voucher tới giờ deploy mà cũng qua luôn giờ end thì hủy thẳng trên DB
                    // (Giả sử status = 2 là Hết hạn / Đã đóng)
                    await pool.request()
                        .input('id', sql.VarChar(10), id)
                        .query(`UPDATE Voucher SET voucher_status = 2 WHERE id_voucher = @id`);

                    console.log(`Voucher ${id} đã quá giờ end, bỏ qua Redis và set hết hạn!`);
                }
            }
        }
    } catch (error) {
        console.error("Lỗi Worker deploy voucher:", error);
    }
});

module.exports = deployVoucherJob;