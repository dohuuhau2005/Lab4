const cron = require('node-cron');
const sql = require('mssql');
const db = require('../config/DBConnection');
const redisClient = require("../config/redisClient");
// Chạy mỗi phút 1 lần
const deployVoucherJob = cron.schedule('* * * * *', async () => {
    try {
        const pool = await db.GetManh1DBPool();

        // 1. Tìm các voucher tới giờ deploy (status = 0)
        const result = await pool.request().query(`
            SELECT id_voucher, quantities, name, discount, type 
            FROM Voucher 
            WHERE voucher_status = 0 AND time_deploy <= GETDATE()
        `);

        const pendingVouchers = result.recordset;

        if (pendingVouchers.length > 0) {
            for (const voucher of pendingVouchers) {
                const id = voucher.id_voucher;

                // 2. Set key chứa thông tin (để show ra UI)
                await redisClient.set(`Voucher:${id}:info`, JSON.stringify(voucher));

                // 3. Set key CHỈ chứa số lượng để đếm (quan trọng)
                await redisClient.set(`Voucher:${id}:quantity`, voucher.quantities);

                // 4. Update status trong DB thành 1 (Đã deploy)
                await pool.request()
                    .input('id', sql.VarChar(10), id)
                    .query(`UPDATE Voucher SET voucher_status = 1 WHERE id_voucher = @id`);

                console.log(`Đã deploy và cache voucher: ${id}`);
            }
        }
    } catch (error) {
        console.error("Lỗi Worker deploy voucher:", error);
    }
});
module.exports = deployVoucherJob;