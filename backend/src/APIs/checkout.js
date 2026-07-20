const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../config/DBConnection');

router.post("/checkout", async (req, res) => {
    const {
        id_user,
        cartItems,
        finalTotal,
        deliveryInfo,
        id_delivery_system,
        paymentType,
        id_voucher
    } = req.body;

    try {
        const pool = await db.GetManh1DBPool();
        const transaction = new sql.Transaction(pool);

        // Mở Transaction: Đảm bảo ACID (Tất cả thành công hoặc tất cả thất bại)
        await transaction.begin();

        try {
            // Bước 1: Tạo Order và lấy id_order vừa được sinh ra (SCOPE_IDENTITY)
            const requestOrder = new sql.Request(transaction);
            const insertOrderQuery = `
                INSERT INTO [Order] (id_user, total_price, status, address, phone, name, id_delivery_system,id_voucher)
                OUTPUT INSERTED.id_order
                VALUES (@id_user, @total_price, @status, @address, @phone, @name, @id_delivery_system, @id_voucher)
            `;
            requestOrder.input('id_user', sql.VarChar(26), id_user);
            requestOrder.input('total_price', sql.Int, finalTotal);
            requestOrder.input('status', sql.Int, 0); // 0: Chờ xác nhận
            requestOrder.input('address', sql.NVarChar(255), deliveryInfo.address);
            requestOrder.input('phone', sql.VarChar(10), deliveryInfo.phone);
            requestOrder.input('name', sql.NVarChar(200), deliveryInfo.name);
            requestOrder.input('id_delivery_system', sql.Int, id_delivery_system); // Thêm input cho id_delivery_system
            requestOrder.input('id_voucher', sql.VarChar(10), id_voucher || null); // Thêm input cho id_voucher

            if (id_voucher) {
                const requestVoucher = new sql.Request(transaction);
                const updateVoucherQuery = `
        UPDATE VoucherHunting 
        SET Active = 0 
        WHERE id_voucher = @id_voucher AND id_user = @id_user
    `;
                requestVoucher.input('id_voucher', sql.VarChar(50), id_voucher);
                requestVoucher.input('id_user', sql.VarChar(26), id_user);
                await requestVoucher.query(updateVoucherQuery);
            }

            const orderResult = await requestOrder.query(insertOrderQuery);
            const newOrderId = orderResult.recordset[0].id_order;

            // Bước 2: Duyệt mảng cartItems để chép vào Order_details
            for (const item of cartItems) {
                const requestDetail = new sql.Request(transaction);
                const insertDetailQuery = `
                    INSERT INTO Order_details (id_order, id_user, name_product, img1, price, measure)
                    VALUES (@id_order, @id_user, @name_product, @img1, @price, @measure)
                `;
                requestDetail.input('id_order', sql.Int, newOrderId);
                requestDetail.input('id_user', sql.VarChar(26), id_user);
                requestDetail.input('name_product', sql.VarChar(100), item.name_product);
                requestDetail.input('img1', sql.VarChar(255), item.thumbnail || '');
                requestDetail.input('price', sql.Int, item.new_price);
                // Dùng cột measure lưu tạm số lượng (quantities) theo DB của bro
                requestDetail.input('measure', sql.NVarChar(10), item.quantities.toString());

                await requestDetail.query(insertDetailQuery);
            }

            // Bước 3: Tạo mã Payment (dùng prefix PAY + timestamp để chống trùng)
            const id_payment = `PAY${Date.now()}`;
            const requestPayment = new sql.Request(transaction);
            const insertPaymentQuery = `
                INSERT INTO payment (id_payment, id_user, total_price, status, id_order, type)
                VALUES (@id_payment, @id_user, @total_price, @status, @id_order, @type)
            `;
            requestPayment.input('id_payment', sql.VarChar(30), id_payment);
            requestPayment.input('id_user', sql.VarChar(26), id_user);
            requestPayment.input('total_price', sql.Int, finalTotal);
            requestPayment.input('status', sql.Bit, 0); // 0: Chưa thanh toán
            requestPayment.input('id_order', sql.Int, newOrderId);
            requestPayment.input('type', sql.Int, paymentType); // 1: Tiền mặt, 2: Chuyển khoản

            await requestPayment.query(insertPaymentQuery);

            // Bước 4: (Tùy chọn) Xóa giỏ hàng của User ở đây nếu cần
            // await new sql.Request(transaction).query(`DELETE FROM Cart_details WHERE ...`);

            // Commit transaction khi tất cả các lệnh đều chạy trót lọt
            await transaction.commit();

            res.status(200).json({
                success: true,
                message: "Tạo đơn hàng thành công!",
                id_order: newOrderId,
                id_payment: id_payment,
                total_price: finalTotal
            });

        } catch (error) {
            // Có bất kỳ lỗi gì ở 3 bước trên -> Rollback sạch sẽ
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error("Lỗi khi Checkout:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi thanh toán" });
    }
});

module.exports = router;