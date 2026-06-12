import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'farmmarket-dev-secret-change-in-production'

/**
 * Signs a payload into a JSON Web Token (JWT).
 * @param {Object} payload - The user data payload to sign.
 * @returns {string} The signed JWT token.
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verifies a JSON Web Token.
 * @param {string} token - The JWT token to verify.
 * @returns {Object|null} The decoded payload if valid, or null if invalid/expired.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

/**
 * Express middleware to enforce authentication.
 * Requires a valid Bearer token in the Authorization header.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 */
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const payload = verifyToken(auth.slice(7))
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' })
  req.user = payload
  next()
}

/**
 * Express middleware for optional authentication.
 * If a valid Bearer token is provided, req.user will be populated, but it won't reject unauthenticated requests.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 */
export function optionalAuth(req, res, next) {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    const payload = verifyToken(auth.slice(7))
    if (payload) req.user = payload
  }
  next()
}
