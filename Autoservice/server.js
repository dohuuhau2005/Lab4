const express = require("express");

require("dotenv").config();
const refreshCategoriesCache =
    require("./src/workers/cacheCategoriesWorker");

const refreshProductByCategoryCache =
    require("./src/workers/cacheProductWorker");

const { consumeVoucherQueue } = require("./src/workers/huntVoucherWorker");
const deployVoucherJob = require("./src/workers/DeployVoucherWorker");
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

deployVoucherJob.start();

consumeVoucherQueue();

app.use(express.json());
app.listen(3000, () => {
    console.log("Server running");
});