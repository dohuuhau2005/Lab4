const express = require("express");


const refreshCategoriesCache =
    require("./src/workers/cacheCategoriesWorker");

const refreshProductByCategoryCache =
    require("./src/workers/cacheProductWorker");

async function startWorkers() {

    await refreshCategoriesCache();

    await refreshProductByCategoryCache();

    setInterval(async () => {

        await refreshCategoriesCache();

        await refreshProductByCategoryCache();

    }, 12 * 60 * 60 * 1000);
}


const app = express();

startWorkers();

app.listen(3000, () => {
    console.log("Server running");
});