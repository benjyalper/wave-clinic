import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })
  const id = Number(req.query.id)

  if (req.method === 'GET') {
    const appt = await prisma.appointment.findFirst({ where: { id, userId }, include: { patient: true, treatmentType: true } })
    if (!appt) return res.status(404).json({ error: 'תור לא נמצא' })
    return res.json(appt)
  }

  if (req.method === 'PUT') {
    const data: any = { ...req.body }
    if (data.startTime) data.startTime = new Date(data.startTime)
    if (data.endTime) data.endTime = new Date(data.endTime)
    if (data.price !== undefined) data.price = Number(data.price)
    if (data.patientId) data.patientId = Number(data.patientId)
    if (data.treatmentTypeId) data.treatmentTypeId = Number(data.treatmentTypeId)
    // Track reschedule
    const existing = await prisma.appointment.findFirst({ where: { id, userId } })
    if (existing && data.startTime && existing.startTime.toISOString() !== new Date(data.startTime).toISOString()) {
      data.rescheduleCount = existing.rescheduleCount + 1
    }
    await prisma.appointment.updateMany({ where: { id, userId }, data })
    return res.json({ success: true })
  }

  if (req.method === 'DELETE') {
    await prisma.appointment.updateMany({ where: { id, userId }, data: { status: 'cancelled' } })
    return res.json({ success: true })
  }

  res.status(405).end()
}
