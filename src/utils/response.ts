import { Response } from 'express';

const response = <T> (res: Response, code: number, message: string, data: T, errorCode: string, errors: T) => {
    return res.status(code).json({
        message,
        data: data?.data ? data.data ?? null : data ?? null,
        errorCode: errorCode ?? null,
        errors: errors ?? null,
    });
};

export default response;