import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, username: true, businessName: true, phone: true, smsSender: true, calendarView: true, showShabbat: true, twoFactor: true, twoFactorMethod: true, markPaidInCalendar: true, smsLoginAlert: true, drawingEnabled: true, bodyDiagramEnabled: true } })
    if (!user) return res.status(404).json({ error: 'משתמש לא נמצא' })
    return res.json(user)
  }

  if (req.method === 'PUT') {
    const { businessName, phone, smsSender, calendarView, showShabbat, twoFactor, twoFactorMethod, markPaidInCalendar, smsLoginAlert, drawingEnabled, bodyDiagramEnabled } = req.body
    await prisma.user.update({ where: { id: userId }, data: { businessName, phone, smsSender, calendarView, showShabbat, twoFactor, twoFactorMethod, markPaidInCalendar, smsLoginAlert, drawingEnabled, bodyDiagramEnabled } })
    return res.json({ success: true })
  }

  res.status(405).end()
}
