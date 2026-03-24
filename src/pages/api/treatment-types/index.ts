import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  if (req.method === 'GET') {
    const types = await prisma.treatmentType.findMany({ where: { userId, active: true }, orderBy: { createdAt: 'asc' } })
    return res.json(types)
  }

  if (req.method === 'POST') {
    const { name, duration, price, color } = req.body
    if (!name || !duration || price === undefined) return res.status(400).json({ error: 'שם, זמן ומחיר נדרשים' })
    const type = await prisma.treatmentType.create({
      data: { userId, name, duration: Number(duration), price: Number(price), color: color || '#3b82f6' }
    })
    return res.status(201).json(type)
  }

  res.status(405).end()
}
