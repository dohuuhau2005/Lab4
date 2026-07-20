const amqp = require('amqplib');

const send = async (idUser, idVoucher) => {
    try {








        // Gói hàng
        const messageToSend = {
            idUser: idUser,
            idVoucher: idVoucher,

        };

        console.log(`đã gửi ${messageToSend}`)

        const rabbitUrl = process.env.serverRabitMQ || 'amqp://localhost:5672';
        const connection = await amqp.connect(rabbitUrl);
        const channel = await connection.createChannel();
        const queueName = 'hunt_voucher_queue';

        await channel.assertQueue(queueName, { durable: true });
        const bufferData = Buffer.from(JSON.stringify(messageToSend));
        channel.sendToQueue(queueName, bufferData, { persistent: true });

        setTimeout(() => {
            connection.close();
        }, 500);
        console.log("🚀 Đã bắn cục data mã hóa qua RabbitMQ thành công!");
    } catch (error) {
        console.error("❌ Lỗi gửi RabbitMQ:", error);
    }
};
module.exports = { send };