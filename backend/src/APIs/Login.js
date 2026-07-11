const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');


router.post('/', async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        request.input('Email', sql.VarChar, email);

        // Query lấy thông tin user
        const query = `exec sp_GetUserByEmail @Email`;
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            if (user.IsLocked) {
                res.status(200).json({

                    isLocked: true,
                    success: true,
                    message: "tài khoản đã bị khóa",

                })
            }

            // Lấy thông tin từ DB
            const MaNV = user.StaffId;
            const salt = user.Salt;
            const emailpassDB = String(user.PasswordHash).trim();
            const role = user.Role; // Lấy quyền (Admin/Staff)
            const position = user.Position;
            const id = user.IdUser;
            const email = user.Email;
            // Xử lý hash password để so sánh
            const passWithSalt = password + salt;
            const hashedPassword = crypto.createHash('sha512').update(passWithSalt).digest('hex');

            // Log để debug (bạn có thể xóa bớt khi đã chạy ổn)
            console.log("Input Password:", password);
            console.log("Salt from DB:", salt);
            console.log("Hashed Input:", hashedPassword);
            console.log("DB Password:", emailpassDB);

            // So sánh mật khẩu
            if (hashedPassword === emailpassDB) {
                console.log("Mật khẩu trùng khớp!");
                let token;
                if (MaNV != null) {
                    token = jwt.sign(
                        { MaNV: MaNV, id: id, email: email, role: role, position: position },
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                    );
                    return res.status(200).json({
                        token: token,
                        role: role,
                        position: position,
                        isLocked: false,
                        success: true,
                        message: "Đăng nhập thành công",
                        id: id,
                        MaNV: MaNV,
                        email: email,
                        FirstName: user.FirstName,
                        LastName: user.LastName,

                    });
                } else {
                    token = jwt.sign(
                        { id: id, email: email, role: role, position: position },
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                    );
                }
                // Tạo token


                console.log("Role gửi đi:", role);
                console.log("Position gửi đi:", position);
                console.log("FirstName gửi đi:", user.FirstName);
                console.log("LastName gửi đi:", user.LastName);
                if (user.DeliverySystemId != null) {
                    console.log("DeliverySystemId gửi đi:", user.DeliverySystemId);
                    return res.status(200).json({
                        token: token,
                        role: role,

                        isLocked: false,
                        success: true,
                        message: "Đăng nhập thành công",
                        id: id,
                        MaNV: MaNV,
                        email: email,
                        FirstName: user.FirstName,

                        DeliverySystemId: user.DeliverySystemId

                    });
                }
                // --- TRẢ VỀ KẾT QUẢ customer ---
                return res.status(200).json({
                    token: token,
                    role: role,

                    isLocked: false,
                    success: true,
                    message: "Đăng nhập thành công",
                    id: id,

                    email: email,
                    FirstName: user.FirstName,
                    LastName: user.LastName,

                });

            } else {
                return res.status(401).json({ success: false, message: "Sai mật khẩu" });
            }

        } else {
            // Không tìm thấy email
            res.json({ exists: false, message: "Tài khoản không tồn tại" });
        }
    } catch (err) {
        console.error('Lỗi kiểm tra email:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});


router.get('/protected', (req, res) => {
    res.json({ message: 'This is a protected route', userId: req.userId });
});

module.exports = router;