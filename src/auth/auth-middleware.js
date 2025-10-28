import passport from 'passport';
import crypto from 'crypto';

function sha256(email) {
  return crypto.createHash('sha256').update(String(email).toLowerCase()).digest('hex');
}

/**
 * Wrap a Passport strategy so that:
 *  - on failure: we return 401 with our JSON error shape
 *  - on success: we attach req.user = { ownerId: <sha256(email)> }
 */
export default function authorize(strategyName) {
  return (req, res, next) => {
    passport.authenticate(strategyName, { session: false }, (err, user, _info) => {
      if (err) return next(err);

      if (!user) {
        if (strategyName === 'basic') {
          res.set('WWW-Authenticate', 'Basic realm="fragments"');
        } else if (strategyName === 'bearer') {
          res.set('WWW-Authenticate', 'Bearer');
        }
        return res
          .status(401)
          .json({ status: 'error', error: { code: 401, message: 'unauthorized' } });
      }

      const email = (user.email || user.sub || '').toLowerCase();
      req.user = { ownerId: sha256(email) };
      return next();
    })(req, res, next);
  };
}
