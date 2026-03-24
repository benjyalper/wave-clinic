import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  if (req.method === 'GET') {
    const leads = await prisma.lead.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
    return res.json(leads)
  }

  if (req.method === 'POST') {
    const { name, phone, email, notes, status } = req.body
    if (!name) return res.status(400).json({ error: 'שם נדרש' })
    const lead = await prisma.lead.create({ data: { userId, name, phone: phone || '', email: email || '', notes: notes || '', status: status || 'new' } })
    return res.status(201).json(lead)
  }

  res.status(405).end()
}
