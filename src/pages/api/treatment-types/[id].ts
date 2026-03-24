import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })
  const id = Number(req.query.id)

  if (req.method === 'PUT') {
    const { name, duration, price, color } = req.body
    await prisma.treatmentType.updateMany({ where: { id, userId }, data: { name, duration: Number(duration), price: Number(price), color } })
    return res.json({ success: true })
  }

  if (req.method === 'DELETE') {
    await prisma.treatmentType.updateMany({ where: { id, userId }, data: { active: false } })
    return res.json({ success: true })
  }

  res.status(405).end()
}
