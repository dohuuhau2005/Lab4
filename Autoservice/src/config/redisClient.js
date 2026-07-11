const { createClient } = require("redis");
require("dotenv").config();

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    database: 0,
    password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

(async () => {
    await redisClient.connect();
    console.log("Redis Connected");
})();

module.exports = redisClient;