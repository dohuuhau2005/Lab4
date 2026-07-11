const { config } = require('dotenv');
const sql = require('mssql');

const dbConfigManh1 = {
    user: process.env.DB_User,
    password: process.env.DB_Password,
    server: process.env.DB_Server1,
    port: 1434,
    database: process.env.DB_Name,
    options: {
        encrypt: true, // bắt buộc nếu dùng Azure
        trustServerCertificate: true, // cần thiết cho local SQL Server
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }

};

const dbConfigManhlocal1 = {
    user: process.env.DB_User,
    password: process.env.DB_PasswordLocal,
    server: process.env.DB_ServerLocal,
    port: 1434,
    database: process.env.DB_Name,
    options: {
        encrypt: true, // bắt buộc nếu dùng Azure
        trustServerCertificate: true, // cần thiết cho local SQL Server
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }

};

const dbConfigManh2 = {
    user: process.env.DB_User,
    password: process.env.DB_Password,
    server: process.env.DB_Server2,
    port: 1436,
    database: process.env.DB_Name,
    options: {
        encrypt: true, // bắt buộc nếu dùng Azure
        trustServerCertificate: true, // cần thiết cho local SQL Server
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }

};

const dbConfigManhlocal2 = {
    user: process.env.DB_User,
    password: process.env.DB_PasswordLocal,
    server: process.env.DB_ServerLocal,
    port: 1436,
    database: process.env.DB_Name,
    options: {
        encrypt: true, // bắt buộc nếu dùng Azure
        trustServerCertificate: true, // cần thiết cho local SQL Server
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }

};

const dbConfigManhWindowServer2 = {
    user: process.env.DB_User,
    password: process.env.DB_PasswordLocal,
    server: process.env.DB_WindowServer2,

    database: process.env.DB_Name,
    options: {
        encrypt: true, // bắt buộc nếu dùng Azure
        trustServerCertificate: true, // cần thiết cho local SQL Server
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }

};
const dbConfigManh3 = {
    user: process.env.DB_User,
    password: process.env.DB_Password,
    server: process.env.DB_Server3,
    port: 1435,
    database: process.env.DB_Name,
    options: {
        encrypt: true, // bắt buộc nếu dùng Azure
        trustServerCertificate: true, // cần thiết cho local SQL Server
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }

};

const dbConfigManhlocal3 = {
    user: process.env.DB_User,
    password: process.env.DB_PasswordLocal,
    server: process.env.DB_ServerLocal,
    port: 1435,
    database: process.env.DB_Name,
    options: {
        encrypt: true, // bắt buộc nếu dùng Azure
        trustServerCertificate: true, // cần thiết cho local SQL Server
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }

};
const dbConfigManhWindowServer3 = {
    user: process.env.DB_User,
    password: process.env.DB_PasswordLocal,
    server: process.env.DB_WindowServer3,

    database: process.env.DB_Name,
    options: {
        encrypt: true, // bắt buộc nếu dùng Azure
        trustServerCertificate: true, // cần thiết cho local SQL Server
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }

};
const dbConfigManh2Users = {
    user: process.env.DB_User,
    password: process.env.DB_Password,
    server: process.env.DB_Server2,
    port: 1434,
    database: process.env.DB_UserManage,
    options: {
        encrypt: true, // bắt buộc nếu dùng Azure
        trustServerCertificate: true, // cần thiết cho local SQL Server
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }

};

const dbConfigManh2UsersLocal = {
    user: process.env.DB_User,
    password: process.env.DB_PasswordLocal,
    server: process.env.DB_ServerLocal,
    port: 1434,
    database: process.env.DB_UserManage,
    options: {
        encrypt: true, // bắt buộc nếu dùng Azure
        trustServerCertificate: true, // cần thiết cho local SQL Server
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }

};



let primaryDBPool = null;
let secondaryDBPool = null;
let thirdDBPool = null;

const GetManh1DBPool = async () => {
    if (primaryDBPool) {
        return primaryDBPool;
    }
    const serverPrior1 = [
        { name: "server 1434", config: dbConfigManh1 },
        { name: "server Local 1434", config: dbConfigManhlocal1 }
    ]

    for (const server of serverPrior1) {
        try {

            primaryDBPool = new sql.ConnectionPool(server.config);
            await primaryDBPool.connect();
            console.log("Kết nối đến cơ sở dữ liệu Mảnh 1! của " + server.name);
            return primaryDBPool;
        }
        catch (err) {
            console.error("Lỗi kết nối đến cơ sở dữ liệu: Mảnh 1 " + process.env.DB_User, err);

        }

    }
    throw new Error("Không thể kết nối với server 1");

};


module.exports = { GetManh1DBPool };