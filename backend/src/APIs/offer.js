const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
router.post("/offer", async (req, res) => {
    try {



        const {
            min_weight,
            max_weight,
            over_weight_price,
            external_price,
            internal_price,
            id_delivery_system,
            time_delivery
        } = req.body;

        const pool = await db.GetManh1DBPool();

        await pool.request()
            .input("min_weight", sql.Int, min_weight)
            .input("max_weight", sql.Int, max_weight)
            .input("over_weight_price", sql.Int, over_weight_price)
            .input("external_price", sql.Int, external_price)
            .input("internal_price", sql.Int, internal_price)
            .input("id_delivery_system", sql.Int, id_delivery_system)
            .input("time_delivery", sql.VarChar(20), time_delivery)
            .query(`
                INSERT INTO DeliveryPrice
                (
                    min_weight,
                    max_weight,
                    over_weight_price,
                    external_price,
                    internal_price,
                    id_delivery_system,
                    time_delivery
                )
                VALUES
                (
                    @min_weight,
                    @max_weight,
                    @over_weight_price,
                    @external_price,
                    @internal_price,
                    @id_delivery_system,
                    @time_delivery
                )
            `);

        return res.status(200).json({
            success: true,
            message: "Insert success"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
});
router.put("/offer/:id_offer", async (req, res) => {
    try {

        const { id_offer } = req.params;

        const {
            min_weight,
            max_weight,
            over_weight_price,
            external_price,
            internal_price,
            time_delivery
        } = req.body;

        const pool = await db.GetManh1DBPool();

        await pool.request()
            .input("id_offer", sql.Int, id_offer)
            .input("min_weight", sql.Int, min_weight)
            .input("max_weight", sql.Int, max_weight)
            .input("over_weight_price", sql.Int, over_weight_price)
            .input("external_price", sql.Int, external_price)
            .input("internal_price", sql.Int, internal_price)
            .input("time_delivery", sql.VarChar(20), time_delivery)
            .query(`
                UPDATE DeliveryPrice
                SET
                    min_weight = @min_weight,
                    max_weight = @max_weight,
                    over_weight_price = @over_weight_price,
                    external_price = @external_price,
                    internal_price = @internal_price,
                    time_delivery = @time_delivery
                WHERE id_offer = @id_offer
            `);

        return res.status(200).json({
            success: true,
            message: "Update success"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
});
router.delete("/offer/:id_offer", async (req, res) => {
    try {

        const { id_offer } = req.params;

        const pool = await db.GetManh1DBPool();

        await pool.request()
            .input("id_offer", sql.Int, id_offer)
            .query(`
                DELETE FROM DeliveryPrice
                WHERE id_offer = @id_offer
            `);

        return res.status(200).json({
            success: true,
            message: "Delete success"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
});
router.get("/offers/:id_delivery_system", async (req, res) => {
    try {

        const { id_delivery_system } = req.params;

        const pool = await db.GetManh1DBPool();

        const result = await pool.request()
            .input(
                "id_delivery_system",
                sql.Int,
                id_delivery_system
            )
            .query(`
                SELECT
                    dp.id_offer,
                    dp.min_weight,
                    dp.max_weight,
                    dp.over_weight_price,
                    dp.external_price,
                    dp.internal_price,
                    dp.time_delivery,
                    ds.id_delivery_system,
                    ds.name AS delivery_name,
                    ds.id_tax
                FROM DeliveryPrice dp
                INNER JOIN DeliverySystem ds
                    ON dp.id_delivery_system =
                       ds.id_delivery_system
                WHERE dp.id_delivery_system =
                      @id_delivery_system
                ORDER BY dp.min_weight
            `);

        return res.status(200).json({
            success: true,
            total: result.recordset.length,
            data: result.recordset
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
});
module.exports = router;