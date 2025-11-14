import { connect, sql } from "../utils/db.js";
import response from "../utils/response.js";
import responsePaginated from "../utils/responsePagination.js";
// jsonwebtoken: ESM/CJS safety normalization
import * as jsonwebtoken from "jsonwebtoken";
const jwt = jsonwebtoken.default ?? jsonwebtoken;
import errHandle from "../utils/fieldErrors.js";
import { revokeTokenString, isTokenRevoked } from "../utils/tokenRevocation.js";
import toEmptyString from "../utils/toEmptyString.js";
import toNull from "../utils/toNull.js";
/*** HELPERS */
const parseJSON = (v) => {
    if (typeof v !== "string" || !v.trim())
        return v ?? null;
    try {
        return JSON.parse(v);
    }
    catch {
        return null;
    }
};
const JWT_SECRET = process.env.JWT_SECRET_KEY ?? "change_me_secret";
export async function login(req, res) {
    const expectedFields = {
        username: "İstifadəçi adını qeyd edin",
        password: "Şifrəni qeyd edin",
    };
    try {
        // 1) body validation
        await errHandle(expectedFields, req.body, res);
        const { username, password } = req.body;
        const pool = await connect();
        // 2) call the procedure
        const rsUser = await pool
            .request()
            .input("USERNAME", sql.NVarChar(50), username)
            .input("PASSWORD", sql.NVarChar(50), password)
            .execute("P_AUTENTICATION");
        const rows = (rsUser.recordset ?? []);
        if (!rows.length) {
            response(res, 400, "Bad request", null, "MISSMATCHED", [
                { fieldName: "username", message: "İstifadəçi adı və ya şifrə səhvdir" },
            ]);
            return;
        }
        const user = rows[0];
        const org = parseJSON(user.ORG); // { value, label, label_short } | null
        // 3) token + payload with org
        const payload = {
            id: user.USER_ID,
            fullName: user.PERSONNEL_NAME,
            roleId: user.ROLE_ID,
            username: user.USERNAME ?? username,
            org,
        };
        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
        const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
        // 4) response
        response(res, 200, "Daxil olundu", {
            accessToken,
            refreshToken,
            user: {
                id: user.USER_ID,
                personnelId: user.PERSONNEL_ID,
                fullName: toEmptyString(user.PERSONNEL_NAME),
                role: toNull({ value: user.ROLE_ID, label: toEmptyString(user.ROLE_NAME) }),
                org: toNull(org),
                insertDate: user.INSERT_DATE,
                username: user.USERNAME ?? username,
                statusId: user.STATUS_ID,
            },
        });
    }
    catch (e) {
        const err = e;
        if (err?.message === "VALIDATION_ABORT")
            return;
        console.error("Server error - Login:", err);
        response(res, 500, "Server error", null, "SERVER_ERROR", { message: "Login zamanı xəta baş verdi" });
    }
}
export async function reg(req, res) {
    const expectedFields = {
        username: "İstifadəçi adını qeyd edin",
        password: "Şifrəni qeyd edin",
        userId: "userId-ni qeyd edin",
        personnelId: "Şəxsi kodu qeyd edin",
        roleId: "Rolun id-sini qeyd edin",
        statusId: "Status id-ni qeyd edin",
        orgId: "Qurumun id-sini qeyd edin",
    };
    try {
        await errHandle(expectedFields, req.body, res);
        const { username, password, userId, personnelId, roleId, statusId, orgId } = req.body;
        const pool = await connect();
        await pool
            .request()
            .input("USERNAME", sql.NVarChar(50), username)
            .input("PASSWORD", sql.NVarChar(50), password)
            .input("USER_ID", sql.Int, userId)
            .input("PERSONNEL_ID", sql.Int, personnelId)
            .input("ROLE_ID", sql.Int, roleId)
            .input("STATUS_ID", sql.Int, statusId)
            .input("ORG_ID", sql.Int, orgId)
            .execute("P_USER_REGISTRATION");
        return response(res, 201, "Qeydiyyat uğurla tamamlandı", null);
    }
    catch (e) {
        const message = e?.message;
        if (typeof message === "string" && message.includes("Bu istifadəçi mövcuddur")) {
            return response(res, 400, "Bad request", null, "EXISTS", [{ message: "Bu istifadəçi artıq mövcuddur" }]);
        }
        console.error("Server error - Registration:", e);
        return response(res, 500, "Server error", null, "SERVER_ERROR", { message: "Qeydiyyat zamanı xəta baş verdi" });
    }
}
// ---------- LOGOUT ----------
export async function logout(req, res) {
    let token = req.token;
    if (!token) {
        const h = req.get("authorization") || req.headers?.Authorization;
        if (!h || typeof h !== "string" || !/^Bearer\s+/i.test(h)) {
            res.status(401).json({ message: "Token tapılmadı" });
            return;
        }
        token = h.split(" ")[1]?.trim();
    }
    // already revoked?
    if (isTokenRevoked(token)) {
        res.status(401).json({ message: "Token etibarsızdır" });
        return;
    }
    // decode just to read exp
    const decoded = jwt.decode(token);
    if (!decoded) {
        res.status(401).json({ message: "Token düzgün deyil" });
        return;
    }
    let expMs = Date.now() + 12 * 3600 * 1000;
    if (typeof decoded === "object" && typeof decoded.exp === "number") {
        expMs = decoded.exp * 1000;
    }
    revokeTokenString(token, expMs);
    res.status(200).json({ message: "Uğurla çıxış edildi, token ləğv edildi" });
}
export async function users(req, res) {
    try {
        const q = req.query ?? {};
        const page = Number(q.page ?? 1);
        const pageSize = Number(q.pageSize ?? 50);
        const userId = q.userId ? Number(q.userId) : null;
        const personnelId = q.personnelId ? Number(q.personnelId) : null;
        const roleId = q.roleId ? Number(q.roleId) : null;
        const statusId = q.statusId ? Number(q.statusId) : null;
        const username = q.username ?? null;
        const insertDateFrom = q.insertDateFrom ? new Date(q.insertDateFrom) : null;
        const insertDateTo = q.insertDateTo ? new Date(q.insertDateTo) : null;
        const orgId = q.orgId ? Number(q.orgId) : null;
        const pool = await connect();
        const result = await pool
            .request()
            .input("page", sql.Int, page)
            .input("pageSize", sql.Int, pageSize)
            .input("userId", sql.Int, userId)
            .input("personnelId", sql.Int, personnelId)
            .input("roleId", sql.TinyInt, roleId)
            .input("statusId", sql.TinyInt, statusId)
            .input("username", sql.NVarChar(50), username)
            .input("insertDateFrom", sql.DateTime, insertDateFrom)
            .input("insertDateTo", sql.DateTime, insertDateTo)
            .input("orgId", sql.Int, orgId)
            .execute("P_GET_USERS");
        // >>> КЛЮЧЕВОЙ МОМЕНТ: приводим recordsets к массиву
        const recordsets = result.recordsets;
        const counters = recordsets?.[0]?.[0] ?? {
            totalCount: 0,
            totalPages: 0,
        };
        const rows = recordsets?.[1] ?? [];
        const items = rows.map((u) => ({
            id: u.USER_ID,
            personnelId: u.PERSONNEL_ID,
            role: { value: u.ROLE_ID, label: toEmptyString(u.ROLE_NAME) },
            insertDate: u.INSERT_DATE,
            statusId: u.STATUS_ID,
            username: toEmptyString(u.USERNAME),
            org: toNull(parseJSON(u.org)),
            firstName: toEmptyString(u.FIRST_NAME),
            lastName: toEmptyString(u.LAST_NAME),
            middleName: toEmptyString(u.MIDDLE_NAME),
            fullName: toEmptyString(u.FULL_NAME),
        }));
        return responsePaginated(res, 200, "GET_USERS-lar uğurla alındı", items, page, pageSize, counters.totalCount, null, null);
    }
    catch (err) {
        console.error("Server error - GET_USERS:", err);
        return response(res, 500, "Server error", null, "SERVER_ERROR", { message: "İstifadəçilərin alınması zamanı xəta baş verdi" });
    }
}
export default { login, reg, logout, users };
