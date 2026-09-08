import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { env } from './env.js';

export const isGoogleConfigured = Boolean(
  env.GOOGLE_CLIENT_ID &&
  env.GOOGLE_CLIENT_SECRET &&
  !env.GOOGLE_CLIENT_ID.startsWith('replace_')
);

export function configurePassport(authService) {
  if (isGoogleConfigured) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: env.GOOGLE_CALLBACK_URL,
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const userAgent = req.headers['user-agent'] || null;
            const ip = req.ip || req.socket.remoteAddress || null;
            const result = await authService.handleGoogleUser({
              profile,
              userAgent,
              ip,
            });
            done(null, result);
          } catch (err) {
            done(err, null);
          }
        }
      )
    );
  } else {
    console.warn('Google OAuth is not configured. Google login will be disabled.');
  }

  return passport;
}
