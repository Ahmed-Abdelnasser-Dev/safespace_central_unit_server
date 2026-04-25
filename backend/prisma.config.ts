import 'dotenv/config';
import { defineConfig } from 'prisma/config';

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
