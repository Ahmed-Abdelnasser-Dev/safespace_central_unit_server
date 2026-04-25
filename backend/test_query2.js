require('dotenv').config({ path: '../.env' });
const prisma = require('./utils/prisma');
async function main() {
  console.log('Connecting to', process.env.DATABASE_URL);
  const result = await prisma.incident.findFirst({ where: { status: 'pending' } });
  console.log('Result:', result);
}
main().catch(console.error).finally(() => prisma.$disconnect());
