const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const uploadCloud = require("../config/multerCloudinary")
const cloudinary = require('cloudinary').v2;
// xóa ảnh ở 1 product 
router.delete("/image/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { oldThumbnailUrl } = req.query;
        const pool = await db.GetManh1DBPool();
        const urlParts = oldThumbnailUrl.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1]; // Lấy "file.jpg"
        const publicId = fileNameWithExt.split('.')[0]; // Cắt đuôi ".jpg" lấy "file"

        // Nếu bro có cấu hình folder trên Cloudinary, public_id có thể cần nối thêm tên folder.
        // Hàm xóa file trên Cloudinary:
        await cloudinary.uploader.destroy(publicId).catch(err => {
            console.error("Lỗi xóa ảnh cũ trên Cloudinary:", err);
        });
        const request = pool.request();
        const query = `delete from images where id_img=@id`;
        request.input("id", sql.Int, parseInt(id));
        const result = await request.query(query);
        res.status(200).json({ message: `đã xóa image ${id} thành công` });
    } catch (error) {
        console.error("lỗi xóa ảnh ", error);
        res.status(500).json({ message: "Lỗi server khi xóa ảnh" });
    }
})
//thay đổi ảnh ở 1 product
router.put("/image/:id", uploadCloud.single("NewImage"), async (req, res) => {
    try {
        const { id } = req.params;
        const { oldThumbnailUrl } = req.query;

        const urlParts = oldThumbnailUrl.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1]; // Lấy "file.jpg"
        const publicId = fileNameWithExt.split('.')[0]; // Cắt đuôi ".jpg" lấy "file"

        // Nếu bro có cấu hình folder trên Cloudinary, public_id có thể cần nối thêm tên folder.
        // Hàm xóa file trên Cloudinary:
        await cloudinary.uploader.destroy(publicId).catch(err => {
            console.error("Lỗi xóa ảnh cũ trên Cloudinary:", err);
        });

        const newThumbnailUrl = req.file ? req.file.path : null; // Lấy URL mới nếu có
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `update images set image_url=@newThumbnailUrl where id_img=@id`;
        request.input("id", sql.Int, parseInt(id));
        request.input("newThumbnailUrl", sql.VarChar(255), newThumbnailUrl);
        const result = await request.query(query);
        res.status(200).json({ message: `đã cập nhật image ${id} thành công` });
    } catch (error) {
        console.error("lỗi cập nhật ảnh ", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật ảnh" });
    }
});
// Thêm ảnh mới cho 1 product
router.post("/image", uploadCloud.single("NewImage"), async (req, res) => {
    try {
        const { id_product } = req.body;
        const newThumbnailUrl = req.file ? req.file.path : null; // Lấy URL mới nếu có
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `insert into images (id_product, image_url) values (@id_product, @newThumbnailUrl)`;
        request.input("id_product", sql.Int, parseInt(id_product));
        request.input("newThumbnailUrl", sql.VarChar(255), newThumbnailUrl);
        const result = await request.query(query);
        res.status(200).json({ message: `đã thêm image cho product ${id_product} thành công` });
    } catch (error) {
        console.error("lỗi thêm ảnh ", error);
        res.status(500).json({ message: "Lỗi server khi thêm ảnh" });
    }
});
module.exports = router;