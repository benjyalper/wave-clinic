import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [totalPatients, totalAppointments, todayAppointments, pendingPayments] = await Promise.all([
    prisma.patient.count({ where: { userId, active: true } }),
    prisma.appointment.count({ where: { userId, status: { not: 'cancelled' } } }),
    prisma.appointment.findMany({ where: { userId, startTime: { gte: today, lt: tomorrow }, status: { not: 'cancelled' } }, include: { patient: true, treatmentType: true }, orderBy: { startTime: 'asc' } }),
    prisma.appointment.count({ where: { userId, paid: false, status: 'completed' } })
  ])

  return res.json({ totalPatients, totalAppointments, todayAppointments, pendingPayments })
}
