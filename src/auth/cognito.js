import passport from 'passport';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import authorize from './auth-middleware.js';
import logger from '../logger.js';

// Required env vars when AUTH_STRATEGY=cognito
const REGION = process.env.AWS_REGION;
const USER_POOL_ID = process.env.COGNITO_POOL_ID;

const ISSUER =
  REGION && USER_POOL_ID
    ? `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`
    : null;

let client = null;
if (ISSUER) {
  client = jwksClient({ jwksUri: `${ISSUER}/.well-known/jwks.json` });
} else {
  logger.warn('Cognito issuer not configured (check AWS_REGION and COGNITO_POOL_ID)');
}

// Get signing key for JWT verification
function getKey(header, callback) {
  if (!client) return callback(new Error('JWKS client not configured'));
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    try {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    } catch (e) {
      callback(e);
    }
  });
}

// Configure Passport Bearer strategy to validate Cognito access tokens
passport.use(
  new BearerStrategy((token, done) => {
    if (!ISSUER) {
      logger.warn('Bearer auth used but ISSUER not configured');
      return done(null, false);
    }

    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: ISSUER,
        // If you want to enforce the client/app audience, uncomment:
        // audience: process.env.COGNITO_APP_CLIENT_ID,
      },
      (err, decoded) => {
        if (err || !decoded) {
          logger.warn({ err }, 'JWT verification failed');
          return done(null, false);
        }

        // Prefer email; fall back to username/sub for owner hashing
        const email =
          decoded.email ||
          decoded.username ||
          decoded['cognito:username'] ||
          decoded.sub;

        if (!email) {
          logger.warn({ decoded }, 'No email/username/sub in token');
        } else {
          logger.debug({ email }, 'Cognito token accepted');
        }

        return done(null, { email });
      }
    );
  })
);

// Export authenticate() using our common authorize wrapper
export const authenticate = () => authorize('bearer');