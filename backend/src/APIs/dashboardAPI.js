const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../config/DBConnection'); // Sửa lại đường dẫn file cấu hình DB của bro cho đúng

// API: GET /management/dashboard/stats
router.get("/stats", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        // Nếu client có gửi ngày lên thì binding vào, không thì SP tự động lấy tháng hiện tại
        if (startDate) request.input('StartDate', sql.DateTime, startDate);
        if (endDate) request.input('EndDate', sql.DateTime, endDate);

        // Gọi thẳng Stored Procedure
        const result = await request.execute('sp_admin_dashboard_stats');

        // Đóng gói 3 mảng kết quả vào 1 cục data trả về
        const data = {
            kpi: result.recordsets[0][0],      // Result set 1: KPI tổng quan (chỉ lấy dòng đầu tiên)
            chartData: result.recordsets[1],     // Result set 2: Data vẽ biểu đồ
            deliveryStats: result.recordsets[2]  // Result set 3: Bảng xếp hạng shipper
        };

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Lỗi lấy data Dashboard:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải thống kê" });
    }
});

module.exports = router;