import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create admin user (matches NextAuth credentials)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      id: '1',
      email: 'admin',
      name: 'Admin User',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Admin user created:', adminUser)

  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
