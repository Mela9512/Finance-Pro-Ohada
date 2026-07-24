import { doubleCsrf } from 'csrf-csrf';

export const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET as string,
  getSessionIdentifier: (req: any) => req.cookies?.access_token || 'anonymous',
  cookieName: 'csrf_token',
  cookieOptions: {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

const CSRF_EXEMPT_PATHS = ['/api/auth/login', '/api/auth/logout'];

export function csrfMiddleware(req: any, res: any, next: any) {
  if (CSRF_EXEMPT_PATHS.includes(req.path)) {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
}
