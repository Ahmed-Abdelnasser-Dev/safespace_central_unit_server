const fs = require('fs');
const path = require('path');

const backendEnvPath = path.resolve(__dirname, '.env');
const legacyMonorepoEnvPath = path.resolve(__dirname, '../.env');
const selectedEnvPath = fs.existsSync(backendEnvPath) ? backendEnvPath : legacyMonorepoEnvPath;
require('dotenv').config({ path: selectedEnvPath });
const prisma = require('./utils/prisma');
async function main() {
  console.log('Connecting to', process.env.DATABASE_URL);
  const result = await prisma.incident.findFirst({ where: { status: 'pending' } });
  console.log('Result:', result);
}
main().catch(console.error).finally(() => prisma.$disconnect());
