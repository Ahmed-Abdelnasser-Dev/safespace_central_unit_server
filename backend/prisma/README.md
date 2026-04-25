# Prisma Setup – SafeSpace User Authentication

This guide explains how to set up Prisma with PostgreSQL, create the database, configure environment variables, run migrations, seed initial data, and inspect the database.

---

## Step 1: Install Project Dependencies

From the backend folder, install all dependencies:

npm install

If Prisma is not installed yet, install it using:

npm install prisma --save-dev  
npm install @prisma/client  

---

## Step 2: Create the Database

Create a PostgreSQL database named:

ssuserauth

You can create it using pgAdmin, PostgreSQL CLI, or any SQL tool with:

CREATE DATABASE ssuserauth;

---

## Step 3: Configure Environment Variables

Create a `.env` file inside the backend root folder and add the following:

DATABASE_URL="postgresql://postgres:your_password@localhost:5432/ssuserauth?schema=public"

Replace `your_password` with your PostgreSQL password.

---

## Step 4: Initialize the Database (Development Setup)

To sync the Prisma schema with the database and insert initial data, run:

npx prisma db push  
npx prisma generate  
npm run db:seed  

This will:
- Create all tables
- Generate Prisma Client
- Insert initial roles and admin user
- Not create migration files

---

## Step 5: Using Migrations (Recommended for Real Development)

Instead of using db push, use migrations:

npx prisma migrate dev --name init  

For example:

npx prisma migrate dev --name create_user_tables  

This will:
- Create migration files
- Apply schema changes
- Maintain migration history

For production environments, use:

npx prisma migrate deploy  

---

## Step 6: Seed the Database

Make sure your package.json contains:

"prisma": {
  "seed": "node prisma/seed.js"
}

Then run:

npm run db:seed  

This inserts:
- Default roles
- Admin user
- Required initial authentication data

---

## Step 7: Open Prisma Studio

To visually inspect and manage your database, run:

npm run db:studio  

Or:

npx prisma studio  

This opens a browser interface where you can view and edit tables.

---

## Full Fresh Setup Workflow

If starting from scratch:

npm install  
npx prisma migrate dev --name init  
npx prisma generate  
npm run db:seed  
npm run db:studio  

---

Prisma is now fully configured for SafeSpace authentication.
