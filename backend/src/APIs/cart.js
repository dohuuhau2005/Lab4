const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');

router.post("/cart", async (req, res) => {
    try {

        const {
            id_user,
            id_product,
            quantities
        } = req.body;

        const pool = await db.GetManh1DBPool();

        const check = await pool.request()
            .input("id_user", sql.VarChar(26), id_user)
            .input("id_product", sql.BigInt, id_product)
            .query(`
                SELECT *
                FROM CartDetails
                WHERE id_cart = @id_user
                  AND id_product = @id_product
            `);

        if (check.recordset.length > 0) {

            await pool.request()
                .input("id_user", sql.VarChar(26), id_user)
                .input("id_product", sql.BigInt, id_product)
                .input("quantities", sql.Int, quantities)
                .query(`
                    UPDATE CartDetails
                    SET quantities =
                        quantities + @quantities
                    WHERE id_cart = @id_user
                      AND id_product = @id_product
                `);

        } else {

            await pool.request()
                .input("id_user", sql.VarChar(26), id_user)
                .input("id_product", sql.BigInt, id_product)
                .input("quantities", sql.Int, quantities)
                .query(`
                    INSERT INTO CartDetails
                    (
                        id_cart,
                        id_product,
                        quantities
                    )
                    VALUES
                    (
                        @id_user,
                        @id_product,
                        @quantities
                    )
                `);

        }

        return res.status(200).json({
            success: true,
            message: "Added to cart"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
});
router.put("/cart", async (req, res) => {
    try {

        const {
            id_cart_detail,
            quantities
        } = req.body;

        const pool = await db.GetManh1DBPool();

        await pool.request()
            .input(
                "id_cart_detail",
                sql.BigInt,
                id_cart_detail
            )
            .input(
                "quantities",
                sql.Int,
                quantities
            )
            .query(`
                UPDATE CartDetails
                SET quantities = @quantities
                WHERE id_cart_detail =
                      @id_cart_detail
            `);

        return res.status(200).json({
            success: true,
            message: "Updated"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
});
router.delete(
    "/cart/:id_cart_detail",
    async (req, res) => {

        try {

            const { id_cart_detail } =
                req.params;

            const pool =
                await db.GetManh1DBPool();

            await pool.request()
                .input(
                    "id_cart_detail",
                    sql.BigInt,
                    id_cart_detail
                )
                .query(`
                    DELETE FROM CartDetails
                    WHERE id_cart_detail =
                          @id_cart_detail
                `);

            return res.status(200).json({
                success: true,
                message: "Deleted"
            });

        } catch (err) {

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }
    }
);
router.get("/cart/:id_user", async (req, res) => {

    try {

        const { id_user } = req.params;

        const pool = await db.GetManh1DBPool();

        const result = await pool.request()
            .input(
                "id_user",
                sql.VarChar(26),
                id_user
            )
            .query(`
                SELECT
                    cd.id_cart_detail,
                    cd.quantities,

                    p.id_product,
                    p.name_product,
                    p.thumbnail,
                    p.new_price,
                    p.old_price,

                    p.quantities as stock_quantity,
                    (cd.quantities *
                     p.new_price)
                     AS total_price

                FROM CartDetails cd

                INNER JOIN Product p
                    ON p.id_product =
                       cd.id_product

                WHERE cd.id_cart =
                      @id_user
            `);

        const total = result.recordset.reduce(
            (sum, item) =>
                sum + item.total_price,
            0
        );

        return res.status(200).json({
            success: true,
            totalPrice: total,
            totalItems:
                result.recordset.length,
            data: result.recordset
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
module.exports = router;