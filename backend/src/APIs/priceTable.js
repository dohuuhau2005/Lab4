const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
router.post("/pricetable", async (req, res) => {
    const { listObjects } = req.body;

    for (const obj of listObjects) {
        const { day_apply, now_price, new_price, id_product } = obj;
        try {
            const pool = await db.GetManh1DBPool();
            const request = pool.request();
            request.input("day_apply", sql.Date, day_apply)
                .input("now_price", sql.Int, parseInt(now_price))
                .input("new_price", sql.Int, parseInt(new_price))
                .input("id_product", sql.Int, parseInt(id_product));
            const query = `
            INSERT INTO PriceTable (day_apply, now_price, new_price, id_product)
            VALUES (@day_apply, @now_price, @new_price, @id_product)
        `;
            console.log("Executing query:", obj);
            const result = await request.query(query);
            if (result.rowsAffected[0] > 0) {
                console.log(`Đã insert thành công đối tượng với id_product: ${id_product}`);
                res.status(200).json({ message: `Đã insert thành công đối tượng với id_product: ${id_product}` });
            }
        } catch (error) {
            console.error("Lỗi khi xử lý đối tượng:", error);
            res.status(500).json({ message: "Lỗi khi xử lý đối tượng" });
        }
    }
})

//sort list product to apply price table
router.get("/pricetable/sort", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const { listcategories, minPrice, maxPrice, id_product, name } = req.query;
        let query = `select Product.id_product, Product.name_product, Product.new_price,Product.quantities, Product.thumbnail from Product `;
        // 4. Lọc theo Category
        if (listcategories) {
            request.input('listcategories', listcategories);
            query += ` join CategoriesDetails on Product.id_product = CategoriesDetails.id_product AND CategoriesDetails.id_categories = @listcategories`;
        }
        query += ` where Product.status=1`;
        if (minPrice) {
            query += ` AND Product.new_price >= @minPrice`;
            request.input("minPrice", sql.Int, parseInt(minPrice));
        }
        if (maxPrice) {
            query += ` AND Product.new_price <= @maxPrice`;
            request.input("maxPrice", sql.Int, parseInt(maxPrice));
        }
        if (id_product) {
            query += ` AND Product.id_product = @id_product`;
            request.input("id_product", sql.Int, parseInt(id_product));
        }
        if (name) {
            query += ` AND Product.name_product LIKE @name`;
            request.input("name", sql.NVarChar, `%${name}%`);
        }

        const result = await request.query(query);
        res.status(200).json({ message: "đã lấy danh sách sản phẩm để áp dụng bảng giá thành công", products: result.recordsets });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm để áp dụng bảng giá:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm để áp dụng bảng giá" });
    }
})

router.get("/pricetable", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `select PriceTable.*, Product.name_product,Product.quantities,Product.thumbnail from PriceTable join Product on PriceTable.id_product = Product.id_product where Product.status=1`;
        const result = await request.query(query);
        res.status(200).json({ message: "đã lấy danh sách price table thành công", pricetable: result.recordsets });
    } catch (error) {
        console.error("lỗi lấy danh sách price table ", error);
    }
})

router.delete("/pricetable/:id", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `delete from PriceTable WHERE id_table = @id`;
        request.input("id", sql.Int, parseInt(req.params.id));
        const result = await request.query(query)
        res.status(200).json({ message: "đã xóa danh sách price table thành công", pricetable: result.recordsets })
    } catch (error) {
        console.error("lỗi xóa danh sách price table ", error);
    }
})
router.put("/pricetable/:id", async (req, res) => {
    try {
        const { dayApply, nowPrice, newPrice } = req.body;
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `UPDATE PriceTable SET day_apply = @day_apply, now_price = @now_price, new_price = @new_price WHERE id = @id`;
        request.input("id", sql.Int, parseInt(req.params.id));
        request.input("day_apply", sql.Date, dayApply);
        request.input("now_price", sql.Int, parseInt(nowPrice));
        request.input("new_price", sql.Int, parseInt(newPrice));
        const result = await request.query(query);
        res.status(200).json({ message: "đã cập nhật danh sách price table thành công", pricetable: result.recordsets });
    } catch (error) {
        console.error("lỗi cập nhật danh sách price table ", error);
    }
})
module.exports = router;