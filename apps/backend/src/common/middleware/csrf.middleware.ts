import { doubleCsrf } from 'csrf-csrf';

const isProd = process.env.NODE_ENV === 'production';

export const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'financepro_csrf_super_secret_key_2026',
  getSessionIdentifier: (req: any) => req.cookies?.access_token || 'anonymous',
  cookieName: 'csrf_token',
  cookieOptions: {
    httpOnly: false,
    // Même raisonnement que le cookie de session : cross-origin en production (Vercel),
    // même site en local.
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

const CSRF_EXEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/accept-invite',
];

export function csrfMiddleware(req: any, res: any, next: any) {
  if (CSRF_EXEMPT_PATHS.includes(req.path)) {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
}
