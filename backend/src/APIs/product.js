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

        const { name_product, quantities, description, price, meta_title, categories, weight } = req.body;

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
                .input("weight", sql.Int, parseInt(weight))
                .input("thumbnail", sql.VarChar(255), thumbnailUrl)

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
router.get("/AdminProduct", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `select * from Product  join images on Product.id_product = images.id_product `
        const result = await request.query(query)
        res.status(200).json({ message: "đã lấy danh sách product thành công", products: result.recordsets })
    } catch (error) {
        console.error("lỗi lấy danh sách san pham ", error);
    }
})
//phải join vào 1 list img 
router.get("/products/:id", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `exec sp_select_particular_product @id`
        request.input("id", sql.Int, parseInt(req.params.id));
        const result = await request.query(query)
        res.status(200).json({ message: "đã lấy danh sách product thành công", products: result.recordsets })
    } catch (error) {
        console.error("lỗi lấy danh sách san pham ", error);
    }
})
router.get("/products", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `select * from Product`
        const result = await request.query(query)
        res.status(200).json({ message: "đã lấy danh sách product thành công", products: result.recordsets })
    } catch (error) {
        console.error("lỗi lấy danh sách san pham ", error);
    }
})


router.get("/TablePriceProducts", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `select distinct Product.id_product, Product.name_product, Product.new_price, Product.quantities, Product.thumbnail from Product   where Product.status=1 `
        const result = await request.query(query)
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
        const query = `update Product set status = -1 where id_product=@id`
        request.input("id", id)
        const result = await request.input("id", sql.Int, id).query(query)
        res.status(200).json({ message: `đã xóa product ${id} thành công` })
    } catch (error) {
        console.error("lỗi lấy danh sách product ", error);
    }
})




//check lại

router.put("/product/:id", uploadCloud.fields([
    { name: 'images', maxCount: 5 },
    { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
        try {
            const { id } = req.params
            const { listImages } = req.body
            const uploadList = req.files['images'] ? req.files['images'].map(file => file.path) : [];
            const thumbnailUrl = req.files['thumbnail'] ? req.files['thumbnail'][0].path : '';
            const { name, description, price, quantities, meta_title } = req.body
            const pool = await db.GetManh1DBPool();
            const request = pool.request()
            const query = `update Product set name_product=@name, description=@description, new_price=@new_price, quantities=@quantities, meta_title=@meta_title where id_product=@id`
            request.input("name", sql.NVarChar(100), name)
                .input("description", sql.NVarChar(255), description)
                .input("new_price", sql.Int, parseInt(price))
                .input("quantities", sql.Int, parseInt(quantities))
                .input("meta_title", sql.NVarChar(200), meta_title)
                .input("id", sql.Int, parseInt(id))
            const result = await request.query(query)
            res.status(200).json({ message: `đã thay đổi product ${id} thành công` })
        } catch (error) {
            console.error("lỗi cập nhật product ", error);
        }
    })
//Active product
router.patch("/product/:id", async (req, res) => {
    try {
        const { id } = req.params
        const pool = await db.GetManh1DBPool();
        const request = pool.request()
        const query = `update Product set status=1 where id_product=@id`
        request.input("id", sql.Int, parseInt(id))
        const result = await request.query(query)
        res.status(200).json({ message: `đã active product ${id} thành công` })
    } catch (error) {
        console.error("lỗi active product ", error);
    }
})
module.exports = router;