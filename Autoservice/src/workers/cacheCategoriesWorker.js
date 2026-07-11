const redisClient = require("../config/redisClient");
const db = require("../config/DBConnection");

async function refreshCategoriesCache() {
    try {
        console.log("Refreshing categories cache...");

        const pool = await db.GetManh1DBPool();

        const result = await pool.request().query(`
            SELECT *
            FROM categories
        `);

        await redisClient.set(
            "categories:all",
            JSON.stringify(result.recordset)
        );

        console.log(
            `Cached ${result.recordset.length} categories`
        );

    } catch (err) {
        console.error("Cache worker error:", err);
    }
}



module.exports = refreshCategoriesCache;