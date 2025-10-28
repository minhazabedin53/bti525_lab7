import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { basicAuth } from './basic.js';
import { fail } from '../services/responses.js';


function tryJwt(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return false;

  const token = h.split(' ')[1];
  try {
    const key = process.env.JWT_PUBLIC || process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, key, {
      algorithms: ['HS256', 'RS256'],
    });

    const subject = String(payload.sub || '').toLowerCase();
    if (!subject) {
      return fail(res, 401, 'invalid token: missing sub');
    }

    const ownerId = crypto.createHash('sha256').update(subject).digest('hex');
    req.user = { ownerId, method: 'jwt' };
    return next(true);
  } catch {
    fail(res, 401, 'invalid or expired token');
    return next(true);
  }
}

export function anyAuth(req, res, next) {
  const h = req.headers.authorization || '';

  if (h.startsWith('Bearer ')) {
    return tryJwt(req, res, (handled) => {
      if (handled === true) return;
      return next();
    });
  }

  if (h.startsWith('Basic ')) {
    return basicAuth(req, res, next);
  }

  res.set('WWW-Authenticate', 'Basic, Bearer');
  return fail(res, 401, 'authentication required');
}