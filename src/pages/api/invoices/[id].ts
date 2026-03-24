import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = verifyToken(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  const id = Number(req.query.id)

  if (req.method === 'GET') {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        patient: true,
        user: { select: { businessName: true, licenseNumber: true, businessLicense: true, phone: true } },
      },
    })
    if (!invoice) return res.status(404).json({ error: 'לא נמצא' })
    return res.json(invoice)
  }

  if (req.method === 'DELETE') {
    await prisma.invoice.deleteMany({ where: { id, userId } })
    return res.status(204).end()
  }

  res.status(405).end()
}
