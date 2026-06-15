import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

export const verifyPassword = (password, passwordHash) => bcrypt.compare(password, passwordHash);

export const hashSecret = (secret) => bcrypt.hash(secret, SALT_ROUNDS);

export const verifySecret = (secret, secretHash) => bcrypt.compare(secret, secretHash);
