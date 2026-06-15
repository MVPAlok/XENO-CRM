import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, role: user.role, type: 'access' },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessTtl }
  );

export const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, role: user.role, type: 'refresh' },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshTtl }
  );

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
