const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const uploadCloud = require("../config/multerCloudinary")
router.post("/product", uploadCloud.fields([
    { name: 'images', maxCount: 5 },
    { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {

        const { name_product, quantities, description, price, id_company, meta_title, categories } = req.body;

        try {
            const pool = await db.GetManh1DBPool();
            const request = pool.request();

            const uploadList = req.files['images'] ? req.files['images'].map(file => file.path) : [];
            const thumbnailUrl = req.files['thumbnail'] ? req.files['thumbnail'][0].path : '';
            const listImageUrls = JSON.stringify(uploadList);

            let parsedCategories = categories;
            if (typeof categories === 'string') {
                parsedCategories = JSON.parse(categories);
            }
            const jsonString = JSON.stringify(parsedCategories);

            // FIX 2 & 3: Ép kiểu INT tường minh bằng parseInt() + khai báo type sql.Int
            // Bổ sung thêm "old_price" bị thiếu
            request.input("name_product", sql.VarChar(100), name_product)
                .input("quantities", sql.Int, parseInt(quantities))
                .input("description", sql.NVarChar(255), description)
                .input("new_price", sql.Int, parseInt(price))
                .input("thumbnail", sql.VarChar(255), thumbnailUrl)
                .input("id_company", sql.Int, parseInt(id_company))
                .input("meta_title", sql.NVarChar(200), meta_title)
                .input("ListCategoriesId", sql.NVarChar(sql.MAX), jsonString)
                .input("ListUrls", sql.NVarChar(sql.MAX), listImageUrls);

            // Thực thi Store Procedure
            const result = await request.execute('sp_InsertProduct');

            console.log(`Đã insert thành công sản phẩm`);
            res.status(200).json({ message: "đã insert thành công" });

        } catch (error) {
            console.error("Lỗi insert danh mục: ", error);
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    })
router.get("/product/:id", async (req, res) => {
    try {
        const { id } = req.params
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `select * from Product where id_company=@id and status=1`
        const result = await request.input("id", sql.Int, id).query(query)
        res.status(200).json({ message: "đã lấy danh sách product thành công", products: result.recordsets })
    } catch (error) {
        console.error("lỗi lấy danh sách san pham ", error);
    }
})
router.delete("/product/:id", async (req, res) => {
    try {
        const { id } = req.params
        const pool = await db.GetManh1DBPool()
        const request = pool.request()
        const query = `update from Product set status = -1 where id_product=@id`
        request.input("id", id)
        const result = await request.input("id", sql.Int, id).query(query)
        res.status(200).json({ message: `đã xóa product ${id} thành công` })
    } catch (error) {
        console.error("lỗi lấy danh sách danh mục ", error);
    }
})






router.put("/categories/:id", async (req, res) => {
    try {
        const { id } = req.params
        const { nameCategories } = req.body
        const pool = await db.GetManh1DBPool();
        const request = pool.request()
        const query = `update categories set name=@name where id=@id`
        request.input("name", sql.NVarChar(30), "name").input("id", sql.Int, id)
        const result = await request.query(query)
        res.status(200).json({ message: `đã thay đổi categories ${id} thành công` })
    } catch (error) {
        console.error("lỗi lấy danh sách danh mục ", error);
    }
})
module.exports = router;