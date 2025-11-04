import passport from "passport";
import { BasicStrategy } from "passport-http";
import authorize from "./auth-middleware.js";

passport.use(
  new BasicStrategy((email, password, done) => {
    if (!email || !password) return done(null, false);
    return done(null, { email });
  }),
);

export const authenticate = () => authorize("basic");
