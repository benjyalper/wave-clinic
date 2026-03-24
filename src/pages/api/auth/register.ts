import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'
import { signToken } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { username, password, email, businessName } = req.body
  if (!username || !password) return res.status(400).json({ error: 'שם משתמש וסיסמה נדרשים' })

  try {
    const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email: email || '' }] } })
    if (existing) return res.status(409).json({ error: 'שם משתמש כבר קיים' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, passwordHash, email: email || `${username}@wave.local`, businessName: businessName || 'הקליניקה שלי' }
    })
    const token = signToken(user.id)
    res.json({ token, user: { id: user.id, username: user.username, businessName: user.businessName } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}
