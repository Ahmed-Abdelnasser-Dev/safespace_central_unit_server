import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

const thisFilePath = fileURLToPath(import.meta.url);
const thisDirectory = path.dirname(thisFilePath);
const backendEnvPath = path.resolve(thisDirectory, '.env');
const legacyMonorepoEnvPath = path.resolve(thisDirectory, '../.env');
const selectedEnvPath = fs.existsSync(backendEnvPath) ? backendEnvPath : legacyMonorepoEnvPath;

loadDotEnv({ path: selectedEnvPath });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  // Use process.env to keep commands like `prisma generate` usable in environments
  // where DATABASE_URL may be injected later.
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
