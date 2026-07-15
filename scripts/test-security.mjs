import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { hashPassword, verifyPassword } = require('../lib/password.js');

const password = 'correct horse battery staple';
const hashed = await hashPassword(password);

assert.notEqual(hashed, password);
assert.deepEqual(await verifyPassword(password, hashed), { valid: true, needsRehash: false });
assert.deepEqual(await verifyPassword('wrong', hashed), { valid: false, needsRehash: false });
assert.deepEqual(await verifyPassword(password, password), { valid: true, needsRehash: true });
assert.deepEqual(await verifyPassword(password, 'scrypt$broken$hash'), { valid: false, needsRehash: false });

console.log('security tests passed');
