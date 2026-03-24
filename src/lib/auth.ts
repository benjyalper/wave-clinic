import jwt from 'jsonwebtoken'
import { NextApiRequest } from 'next'

const JWT_SECRET = process.env.JWT_SECRET || 'wave-clinic-secret-key-change-in-production'

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number }
  } catch {
    return null
  }
}

export function getUserIdFromRequest(req: NextApiRequest): number | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const payload = verifyToken(token)
  return payload?.userId ?? null
}
