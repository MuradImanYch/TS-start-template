import sql from "mssql";
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || "",
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};
export async function connect() {
    try {
        const pool = await sql.connect(config);
        console.log("✅ MSSQL: Bağlantı uğurludur");
        return pool;
    }
    catch (err) {
        console.error("❌ MSSQL bağlantı xətası:", err);
        throw err;
    }
}
export { sql };
