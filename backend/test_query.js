const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });
async function main() {
  console.log('Connecting...');
  const result = await prisma.incident.findFirst({ where: { status: 'pending' } });
  console.log('Result:', result);
}
main().catch(console.error).finally(() => prisma.$disconnect());
