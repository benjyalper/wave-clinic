import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  if (req.method === 'GET') {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { invoiceNumber: 'desc' },
    })
    return res.json(invoices)
  }

  if (req.method === 'POST') {
    const { patientId, invoiceType, issueDate, items, vatRate, paymentMethod, paymentDate, notes } = req.body

    // Calculate totals
    const subtotal = (items as any[]).reduce((sum: number, i: any) => sum + i.total, 0)
    const vatAmount = Math.round((subtotal * vatRate) / 100 * 100) / 100
    const total = Math.round((subtotal + vatAmount) * 100) / 100

    // Get next invoice number for this user
    const last = await prisma.invoice.findFirst({
      where: { userId },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    })
    const invoiceNumber = (last?.invoiceNumber ?? 0) + 1

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        patientId: Number(patientId),
        invoiceNumber,
        invoiceType: invoiceType || 'חשבונית מס קבלה',
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        items,
        subtotal,
        vatRate: vatRate ?? 17,
        vatAmount,
        total,
        paymentMethod: paymentMethod || 'מזומן',
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        notes: notes || '',
      },
      include: { patient: { select: { firstName: true, lastName: true } } },
    })
    return res.status(201).json(invoice)
  }

  res.status(405).end()
}
