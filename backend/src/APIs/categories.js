const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

router.post("/categories", async (req, res) => {
    const { nameCategories } = req.body;
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const jsonString = JSON.stringify(nameCategories);
        request.input("ListCategories", sql.NVarChar(sql.MAX), jsonString)
        const query = `
        INSERT INTO categories (name)
        SELECT value 
        FROM OPENJSON(@ListCategories)

    `;
        const result = await request.query(query);
        console.log(`Đã insert thành công ${result.rowsAffected[0]} danh mục!`);
        res.status(200).json({ message: "đã insert thành công", number: result.rowsAffected[0] })
    } catch (error) {
        console.error("lỗi insert danh mục ", error);
    }

})
router.get("/categories", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `select * from categories`
        const result = await request.query(query)
        res.status(200).json({ message: "đã lấy danh sách categories thành công", categories: result.recordset })
    } catch (error) {
        console.error("lỗi lấy danh sách danh mục ", error);
    }
})
router.delete("/categories/:id", async (req, res) => {
    try {
        const { id } = req.params
        const pool = await db.GetManh1DBPool()
        const request = pool.request()
        const query = `delete from categories where id_categories=@id`
        request.input("id", id)
        const result = await request.query(query)
        res.status(200).json({ message: `đã xóa categories ${id} thành công` })
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