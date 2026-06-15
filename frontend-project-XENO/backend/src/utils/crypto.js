import crypto from 'crypto';

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

export const stableHash = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');
