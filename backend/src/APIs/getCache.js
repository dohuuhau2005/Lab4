const redisClient = require("../config/redisClient");

const express = require('express');
const router = express.Router();

router.get("/categories", async (req, res) => {
    try {
        const cachedCategories = await redisClient.get("categories:all");
        if (cachedCategories) {
            console.log("Serving categories from cache");
            return res.status(200).json({
                message: "đã lấy danh sách categories thành công (from cache)",
                categories: JSON.parse(cachedCategories)
            });
        }
        const pool = await db.GetManh1DBPool();
        const result = await pool.request().query(`
            SELECT *
            FROM categories
        `);
        await redisClient.set(
            "categories:all",
            JSON.stringify(result.recordset)
        );

        return res.status(200).json({
            message: "đã lấy danh sách categories thành công",
            categories: result.recordset
        });
    } catch (err) {
        console.error("Error fetching categories:", err);
        return res.status(500).json({
            message: "Lỗi khi lấy danh sách categories"
        });
    }
});
//xài hashmap loại bỏ trùng
router.get("/products/all", async (req, res) => {
    try {

        const keys = await redisClient.keys(
            "Product:*:all"
        );

        if (keys.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No product cache found"
            });
        }

        const values =
            await redisClient.mGet(keys);

        const productMap = new Map();

        for (const cache of values) {

            if (!cache) continue;

            const products =
                JSON.parse(cache);

            for (const product of products) {

                productMap.set(
                    product.id_product,
                    product
                );

            }
        }

        const uniqueProducts =
            [...productMap.values()];

        // Fisher-Yates Shuffle
        for (
            let i = uniqueProducts.length - 1;
            i > 0;
            i--
        ) {

            const j = Math.floor(
                Math.random() * (i + 1)
            );

            [
                uniqueProducts[i],
                uniqueProducts[j]
            ] =
                [
                    uniqueProducts[j],
                    uniqueProducts[i]
                ];
        }

        const result =
            uniqueProducts.slice(0, 60);

        return res.status(200).json({
            success: true,
            total: result.length,
            data: result
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
});
router.get("/products/category/:idCategory", async (req, res) => {
    try {

        const { idCategory } = req.params;

        const cache = await redisClient.get(
            `Product:${idCategory}:all`
        );

        if (!cache) {
            return res.status(404).json({
                success: false,
                message: "Category cache not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: JSON.parse(cache)
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
});
module.exports = router;
