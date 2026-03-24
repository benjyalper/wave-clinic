import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  if (req.method === 'GET') {
    const tasks = await prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
    return res.json(tasks)
  }

  if (req.method === 'POST') {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'טקסט נדרש' })
    const task = await prisma.task.create({ data: { userId, text } })
    return res.status(201).json(task)
  }

  res.status(405).end()
}
