import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })
  const id = Number(req.query.id)

  if (req.method === 'GET') {
    const patient = await prisma.patient.findFirst({ where: { id, userId } })
    if (!patient) return res.status(404).json({ error: 'מטופל לא נמצא' })
    return res.json(patient)
  }

  if (req.method === 'PUT') {
    const patient = await prisma.patient.updateMany({
      where: { id, userId },
      data: req.body
    })
    return res.json(patient)
  }

  if (req.method === 'DELETE') {
    await prisma.patient.updateMany({ where: { id, userId }, data: { active: false } })
    return res.json({ success: true })
  }

  res.status(405).end()
}
