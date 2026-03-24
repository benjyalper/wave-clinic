import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  if (req.method === 'GET') {
    const { from, to, patientId, paid, treatmentTypeId } = req.query
    const where: any = { userId }
    if (from || to) {
      where.startTime = {}
      if (from) where.startTime.gte = new Date(String(from))
      if (to) where.startTime.lte = new Date(String(to))
    }
    if (patientId) where.patientId = Number(patientId)
    if (paid !== undefined) where.paid = paid === 'true'
    if (treatmentTypeId) where.treatmentTypeId = Number(treatmentTypeId)

    const appointments = await prisma.appointment.findMany({
      where,
      include: { patient: true, treatmentType: true },
      orderBy: { startTime: 'asc' }
    })
    return res.json(appointments)
  }

  if (req.method === 'POST') {
    const { patientId, treatmentTypeId, startTime, endTime, price, paid, paymentMethod, notes, status } = req.body
    if (!patientId || !startTime || !endTime || price === undefined) return res.status(400).json({ error: 'מטופל, זמן התחלה, זמן סיום ומחיר נדרשים' })
    const appt = await prisma.appointment.create({
      data: {
        userId, patientId: Number(patientId),
        treatmentTypeId: treatmentTypeId ? Number(treatmentTypeId) : null,
        startTime: new Date(startTime), endTime: new Date(endTime),
        price: Number(price), paid: paid || false,
        paymentMethod: paymentMethod || '', notes: notes || '',
        status: status || 'scheduled'
      },
      include: { patient: true, treatmentType: true }
    })
    return res.status(201).json(appt)
  }

  res.status(405).end()
}
