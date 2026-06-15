import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { randomToken } from '../utils/crypto.js';
import { hashPassword, hashSecret, verifyPassword, verifySecret } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  avatarUrl: user.avatarUrl,
  role: user.role,
  status: user.status,
  isEmailVerified: user.isEmailVerified,
});

const issueTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash: await hashSecret(refreshToken),
      sessionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  return { accessToken, refreshToken };
};

export const signup = asyncHandler(async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (existing) throw new ApiError(409, 'Email is already registered');

  const user = await prisma.user.create({
    data: {
      email: req.body.email,
      passwordHash: await hashPassword(req.body.password),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      avatarUrl: req.body.avatarUrl || null,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      isEmailVerified: true,
    },
  });

  const tokens = await issueTokens(user);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    user: publicUser(user),
    ...tokens,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.body.token || req.query.token;
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiry: { gt: new Date() },
    },
  });
  if (!user) throw new ApiError(400, 'Invalid or expired verification token');

  const verified = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });
  const tokens = await issueTokens(verified);

  res.json({ success: true, ...tokens, user: publicUser(verified) });
});

export const login = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user || user.deletedAt || user.status !== 'ACTIVE') throw new ApiError(401, 'Invalid email or password');

  const valid = await verifyPassword(req.body.password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: req.ip,
    },
  });

  const tokens = await issueTokens(updated);
  res.json({ success: true, ...tokens, user: publicUser(updated) });
});

export const refresh = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = verifyRefreshToken(req.body.refreshToken);
  } catch (_error) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await prisma.user.findFirst({
    where: {
      id: payload.sub,
      status: 'ACTIVE',
      deletedAt: null,
      sessionExpiry: { gt: new Date() },
    },
  });
  if (!user?.refreshTokenHash) throw new ApiError(401, 'Refresh token has been revoked');

  const valid = await verifySecret(req.body.refreshToken, user.refreshTokenHash);
  if (!valid) throw new ApiError(401, 'Refresh token has been rotated');

  const tokens = await issueTokens(user);
  res.json({ success: true, ...tokens });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

export const logout = asyncHandler(async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      refreshTokenHash: null,
      sessionExpiry: null,
    },
  });
  res.json({ success: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: randomToken(),
        passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  }
  res.json({ success: true, message: 'If the account exists, a password reset token was generated.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: req.body.token,
      passwordResetExpiry: { gt: new Date() },
    },
  });
  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(req.body.password),
      passwordResetToken: null,
      passwordResetExpiry: null,
      refreshTokenHash: null,
      sessionExpiry: null,
    },
  });
  res.json({ success: true });
});
