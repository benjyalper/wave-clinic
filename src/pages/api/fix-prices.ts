import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { getUserIdFromRequest } from '../../lib/auth'

// One-time utility: back-fill price=0 appointments with their treatmentType's price
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  // Find all appointments with price=0 that have a treatmentType with price>0
  const appts = await prisma.appointment.findMany({
    where: { userId, price: 0, treatmentTypeId: { not: null } },
    include: { treatmentType: true },
  })

  let updated = 0
  for (const a of appts) {
    if (a.treatmentType && a.treatmentType.price > 0) {
      await prisma.appointment.update({ where: { id: a.id }, data: { price: a.treatmentType.price } })
      updated++
    }
  }

  // Also return a summary of all paid appointments and their prices
  const paid = await prisma.appointment.findMany({
    where: { userId, paid: true },
    select: { id: true, price: true, paid: true, treatmentType: { select: { name: true, price: true } } },
  })

  return res.json({ updated, paidAppointments: paid })
}
