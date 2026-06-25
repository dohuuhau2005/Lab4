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
        const query = `SELECT [User].id_user as IdUser, email as Email, password as Password, 
                                        salt as Salt, is_locked as IsLocked, id_staff as IdStaff,
                                        Position as position, role as Role 
                                 FROM [User] 
                                 LEFT JOIN Staff ON [User].id_user = Staff.id_user 
                                 LEFT JOIN Company ON [User].id_user = Company.id_user 
                                 LEFT JOIN Customer ON [User].id_user = Customer.id_user 
                                 WHERE [User].email = @Email`
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
            const MaNV = user.IdStaff;
            const salt = user.Salt;
            const emailpassDB = String(user.Password).trim();
            const role = user.Role; // Lấy quyền (Admin/Staff)
            const position = user.position;
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
                } else {
                    token = jwt.sign(
                        { id: id, email: email, role: role, position: position },
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                    );
                }
                // Tạo token


                console.log("Role gửi đi:", role);

                // --- TRẢ VỀ KẾT QUẢ KÈM ROLE CHO JAVA ---
                return res.status(200).json({
                    token: token,
                    role: role,
                    position: position,
                    isLocked: false,
                    success: true,
                    message: "Đăng nhập thành công",
                    id: id,
                    MaNV: MaNV,
                    email: email
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