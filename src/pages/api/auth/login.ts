import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'
import { signToken } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'שם משתמש וסיסמה נדרשים' })

  try {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' })

    const token = signToken(user.id)
    res.json({ token, user: { id: user.id, username: user.username, businessName: user.businessName } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}
