import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return req.query.token || null;
};

export const protect = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);
  if (!token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (_error) {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const user = await prisma.user.findFirst({
    where: {
      id: payload.sub,
      status: 'ACTIVE',
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      status: true,
      isEmailVerified: true,
    },
  });

  if (!user) throw new ApiError(401, 'Authenticated user no longer exists');
  req.user = user;
  return next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (req.user.role === 'SUPER_ADMIN' || roles.includes(req.user.role)) return next();
  return next(new ApiError(403, 'Insufficient role permissions'));
};
