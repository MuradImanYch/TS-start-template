export default function response(res, code, message, data = null, errorCode = null, errors = null) {
    return res.status(code).json({
        message,
        data: data?.data ?? data ?? null,
        errorCode,
        errors,
    });
}
