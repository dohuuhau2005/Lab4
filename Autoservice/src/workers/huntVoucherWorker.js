const amqp = require('amqplib');

const sql = require('mssql');
const db = require('../config/DBConnection');

const consumeVoucherQueue = async () => {
    try {
        const rabbitUrl = process.env.serverRabitMQ || 'amqp://localhost:5672';
        const connection = await amqp.connect(rabbitUrl);
        const channel = await connection.createChannel();
        const queueName = 'hunt_voucher_queue';

        // durable: true để đảm bảo queue không bị mất khi RabbitMQ restart
        await channel.assertQueue(queueName, { durable: true });

        //  Bắt Worker xử lý tối đa 10 message cùng lúc.
        // Xong cái nào mới nhận thêm cái đó, giúp DB không bị quá tải.
        channel.prefetch(10);

        console.log(`[*] Worker đang chầu chực nghe trên queue: ${queueName}`);

        channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                try {
                    // 1. Mở gói hàng
                    const data = JSON.parse(msg.content.toString());
                    const { idUser, idVoucher } = data;

                    console.log(`Đang xử lý voucher ${idVoucher} cho user ${idUser}`);


                    // 3. Connect DB và Insert vào bảng UserVoucher
                    const pool = await db.GetManh1DBPool();
                    const request = pool.request();

                    const query = `
                        INSERT INTO VoucherHunting (id_user, id_voucher)
                        VALUES (@id_user, @id_voucher)
                    `;

                    await request
                        .input('id_user', sql.VarChar(26), idUser)
                        .input('id_voucher', sql.VarChar(10), idVoucher)
                        .query(query);

                    // 4. Báo cáo RabbitMQ: "Tao xử lý xong rồi, mày xóa message đi"
                    channel.ack(msg);
                    console.log(`✅ Lưu thành công! User ${idUser} đã giật được voucher ${idVoucher}`);

                } catch (err) {
                    console.error("❌ Lỗi khi xử lý message, đưa vào diện tình nghi:", err);

                    // Nếu lỗi do DB sập, network... thì nack với tham số requeue = false 
                    // để đưa message này vào Dead Letter Queue (nếu có setup), hoặc true để nhét lại vào đầu hàng đợi
                    channel.nack(msg, false, false);
                }
            }
        });
    } catch (error) {
        console.error("❌ Lỗi khởi tạo RabbitMQ Worker:", error);
    }
};

module.exports = { consumeVoucherQueue };