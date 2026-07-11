const redisClient = require("../config/redisClient");
const db = require("../config/DBConnection");
const sql = require('mssql');
async function refreshProductByCategoryCache() {
    try {

        console.log("Refreshing Product Cache...");
        const pool = await db.GetManh1DBPool();
        const categoriesCache =
            await pool.request().query(`
                SELECT *
                FROM categories
            `).then(result => JSON.stringify(result.recordset));

        if (!categoriesCache) {
            console.log("Categories cache not found");
            return;
        }

        const categories = JSON.parse(categoriesCache);

        // const pool = await db.GetManh1DBPool();

        for (const category of categories) {

            const result = await pool
                .request()
                .input(
                    "id_categories",
                    sql.Int,
                    category.id_categories
                )
                .query(`
                    SELECT TOP 60
                        p.id_product,
                        p.name_product,
                        p.old_price,
                        p.new_price,
                        p.thumbnail,
                        p.quantities
                    FROM Product p
                    INNER JOIN CategoriesDetails cd
                        ON p.id_product = cd.id_product
                    WHERE cd.id_categories = @id_categories and p.status = 1
                    ORDER BY p.id_product DESC
                `);

            const redisKey =
                `Product:${category.id_categories}:all`;

            await redisClient.set(
                redisKey,
                JSON.stringify(result.recordset)
            );

            console.log(
                `${redisKey} => ${result.recordset.length} products`
            );
        }

        console.log("Product cache completed");

    } catch (error) {
        console.error(error);
    }
}

module.exports = refreshProductByCategoryCache;