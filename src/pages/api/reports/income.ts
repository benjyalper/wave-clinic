import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  const { from, to } = req.query
  const where: any = { userId, paid: true }
  if (from || to) {
    where.startTime = {}
    if (from) where.startTime.gte = new Date(String(from))
    if (to) where.startTime.lte = new Date(String(to))
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { patient: true, treatmentType: true },
    orderBy: { startTime: 'desc' }
  })

  const totalWithVat = appointments.reduce((sum, a) => sum + a.price, 0)
  const totalWithoutVat = totalWithVat / 1.17 // Israeli VAT 17%

  const byCash = appointments.filter(a => a.paymentMethod === 'מזומן').reduce((sum, a) => sum + a.price, 0)
  const byTransfer = appointments.filter(a => a.paymentMethod !== 'מזומן' && a.paymentMethod !== '').reduce((sum, a) => sum + a.price, 0)

  return res.json({ appointments, totalWithVat, totalWithoutVat: Math.round(totalWithoutVat * 100) / 100, byCash, byTransfer })
}
