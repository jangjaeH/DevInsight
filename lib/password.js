// eslint-disable-next-line @typescript-eslint/no-require-imports
const { randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('node:crypto');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { promisify } = require('node:util');

const scrypt = promisify(scryptCallback);
const PREFIX = 'scrypt';

async function hashPassword(password) {
    const salt = randomBytes(16).toString('base64');
    const hash = await scrypt(password, salt, 32);
    return `${PREFIX}$${salt}$${hash.toString('base64')}`;
}

async function verifyPassword(password, storedPassword) {
    if (typeof storedPassword !== 'string') return { valid: false, needsRehash: false };

    const [prefix, salt, encodedHash] = storedPassword.split('$');

    if (prefix !== PREFIX || !salt || !encodedHash) {
        const valid = password === storedPassword;
        return { valid, needsRehash: valid };
    }

    try {
        const storedHash = Buffer.from(encodedHash, 'base64');
        if (storedHash.length !== 32) return { valid: false, needsRehash: false };
        const suppliedHash = await scrypt(password, salt, storedHash.length);
        return { valid: timingSafeEqual(storedHash, suppliedHash), needsRehash: false };
    } catch {
        return { valid: false, needsRehash: false };
    }
}

module.exports = { hashPassword, verifyPassword };
