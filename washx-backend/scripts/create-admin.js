/**
 * WashX Admin Account Setup Script
 * Run: node scripts/create-admin.js
 * Creates the first SUPER admin user.
 */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@washx.in';
  const password = process.env.ADMIN_PASSWORD || 'WashX@Admin2024!';
  const name = process.env.ADMIN_NAME || 'WashX Super Admin';

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.adminUser.create({
    data: { email, passwordHash, name, role: 'SUPER' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  console.log('? Admin created successfully:');
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role: ${admin.role}`);
  console.log(`  ID: ${admin.id}`);
  console.log('\n??  Change the password after first login via PUT /api/auth/change-password');
}

main().catch(console.error).finally(() => prisma.$disconnect());
