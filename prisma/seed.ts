import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('demo123', 10)

  const user = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@wave-clinic.com',
      passwordHash,
      businessName: 'פסיכולוג',
      phone: '050-0000000',
    }
  })

  // Seed treatment types (generic names, no real patient data)
  const treatmentTypes = [
    { name: 'טיפול פסיכולוגי', duration: 50, price: 350, color: '#3b82f6' },
    { name: 'פסיכותרפיה', duration: 50, price: 400, color: '#8b5cf6' },
    { name: 'טיפול פסיכולוגי בשיחה מרחוק', duration: 50, price: 200, color: '#06b6d4' },
    { name: 'פגישת הערכה ראשונית', duration: 60, price: 450, color: '#22c55e' },
    { name: 'ביטול מאוחר', duration: 10, price: 150, color: '#ef4444' },
    { name: 'ייעוץ', duration: 30, price: 200, color: '#f59e0b' },
  ]

  for (const tt of treatmentTypes) {
    await prisma.treatmentType.create({ data: { userId: user.id, ...tt } })
  }

  console.log('Seed completed. Demo user: username=demo, password=demo123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
