import jwt from 'jsonwebtoken';

export function isValidToken(token?: string) {
    if (!token || !process.env.JWT_SECRET) return false;

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return typeof payload === 'object' && typeof payload.usercode === 'string';
    } catch {
        return false;
    }
}
