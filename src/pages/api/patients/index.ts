import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getUserIdFromRequest } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'לא מורשה' })

  if (req.method === 'GET') {
    const { search } = req.query
    const where: any = { userId, active: true }
    if (search) {
      where.OR = [
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search) } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { idNumber: { contains: String(search) } },
      ]
    }
    const patients = await prisma.patient.findMany({ where, orderBy: { createdAt: 'desc' } })
    return res.json(patients)
  }

  if (req.method === 'POST') {
    const { firstName, lastName, phone, phoneAlt, email, birthDate, idNumber, address, hmo, invoiceName, gender, notes, tags } = req.body
    if (!firstName || !lastName || !phone) return res.status(400).json({ error: 'שם פרטי, שם משפחה וטלפון נדרשים' })
    const patient = await prisma.patient.create({
      data: { userId, firstName, lastName, phone, phoneAlt: phoneAlt || '', email: email || '', birthDate: birthDate ? new Date(birthDate) : null, idNumber: idNumber || '', address: address || '', hmo: hmo || '', invoiceName: invoiceName || '', gender: gender || 'male', notes: notes || '', tags: tags || [] }
    })
    return res.status(201).json(patient)
  }

  res.status(405).end()
}
