// msBenhNhan_BrainTumor_timestamp
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { GetManh1DBPool } = require('./src/config/DBConnection')
const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép các request không có origin (như Postman) hoặc từ localhost:5174
        const allowedOrigins = ['http://localhost:5174', 'http://localhost:5173', 'http://192.168.1.10:3000', 'http://192.168.195.89:5174', 'http://127.0.0.1:5174', 'http://localhost:3000', 'http://192.168.1.10:5174', 'http://192.168.195.89:5173'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Chặn bởi CORS: Origin không được phép'));
        }
    },
    credentials: true, // Bắt buộc phải có để nhận Cookie/Authorization header
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 204 // Một số trình duyệt cũ (IE11) yêu cầu 204 thay vì 200
};

app.use(cors(corsOptions));
app.get("/", (req, res) => {
    res.send("Server Backend lap4");
})

app.use(express.json())

// app.use("/file", require("./src/APIs/uploadRoute"))


GetManh1DBPool().then(() => console.log("Manh 1 ok")).catch(console.error("Het cuu"))

app.use('/login', require('./src/APIs/Login'))
app.use('/admin', require("./src/APIs/categories"))
app.use('/admin', require("./src/APIs/product"))
app.use('/price', require("./src/APIs/priceTable"))
app.use('/admin', require("./src/APIs/voucher"))
app.use('/cache', require("./src/APIs/getCache"))
app.use('/delivery', require("./src/APIs/offer"))
app.use('/customer', require("./src/APIs/cart"))

const PORT = process.env.port_serverBackend || 9999;
app.listen(PORT, '0.0.0.0', () => {
    console.log("========================================");
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔗 Access at: http://localhost:${PORT}`);
    console.log("========================================");
});