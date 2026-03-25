import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  if (req.method === 'GET') {
    const patientId = Number(req.query.patientId)
    if (!patientId) return res.status(400).json({ error: 'patientId נדרש' })
    const notes = await prisma.treatmentNote.findMany({
      where: { userId, patientId },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(notes)
  }

  if (req.method === 'POST') {
    const { patientId, content } = req.body
    if (!patientId) return res.status(400).json({ error: 'patientId נדרש' })
    const note = await prisma.treatmentNote.create({
      data: { userId, patientId: Number(patientId), content: content || '' },
    })
    return res.status(201).json(note)
  }

  res.status(405).end()
}
