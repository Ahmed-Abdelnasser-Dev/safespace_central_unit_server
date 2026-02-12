// ─────────────────────────────────────────────────────────────────────────────
// prisma/seed.js — Database Seed
// Run npx prisma db push
// npx prisma generate
// npm run db:seed
// ─────────────────────────────────────────────────────────────────────────────
// Creates:
//   - 4 roles
//   - 11 permissions
//   - Role-permission mappings
//   - 4 users (one per role, all Egyptian names)
//
// Default password for ALL users: Test@123456
// All users must change password on first login.
// ─────────────────────────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Starting database seed...\n');

  // ─── 1. ROLES ─────────────────────────────────────────────────────────────
  console.log('📋 Creating roles...');

  const roleDefs = [
    { name: 'admin', description: 'Full system administrator with all privileges' },
    { name: 'emergency_dispatcher', description: 'Handles emergency calls and dispatching units to incidents' },
    { name: 'road_observer', description: 'Monitors road conditions and reports incidents' },
    { name: 'node_maintenance_crew', description: 'Maintains and services roadside nodes' },
  ];
  for (const r of roleDefs) {
      await prisma.role.upsert({
        where: { name: r.name },
        update: {},
        create: r,
      });
    }
  // Fetch roles to get correct IDs
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const dispatcherRole = await prisma.role.findUnique({ where: { name: 'emergency_dispatcher' } });
  const observerRole = await prisma.role.findUnique({ where: { name: 'road_observer' } });
  const maintenanceRole = await prisma.role.findUnique({ where: { name: 'node_maintenance_crew' } });
    
  const roles = [adminRole, dispatcherRole, observerRole, maintenanceRole];
  console.log(`   ✅ ${roles.length} roles created`);


  // ─── 2. PERMISSIONS ───────────────────────────────────────────────────────
  console.log('🔑 Creating permissions...');

  const permissionDefs = [
    // Users
    { resource: 'users', action: 'read',   description: 'View user information' },
    { resource: 'users', action: 'create', description: 'Create new user accounts' },
    { resource: 'users', action: 'update', description: 'Update user information' },
    { resource: 'users', action: 'delete', description: 'Delete user accounts' },
    { resource: 'users', action: 'manage', description: 'Full user management including role assignment' },
    // System
    { resource: 'system', action: 'read',   description: 'View system settings' },
    { resource: 'system', action: 'manage', description: 'Manage system settings' },
    // Dashboard
    { resource: 'dashboard', action: 'read', description: 'View dashboard and analytics' },
    // Audit logs
    { resource: 'audit_logs', action: 'read',   description: 'View audit logs' },
    { resource: 'audit_logs', action: 'manage', description: 'Full audit log access' },
  ];

  const permissions = [];
    for (const p of permissionDefs) {
      const perm = await prisma.permission.upsert({
        where: { resource_action: { resource: p.resource, action: p.action } },
        update: {},
        create: p,
      });
      permissions.push(perm);
    }

    console.log(`   ✅ ${permissions.length} permissions created`);


  // Helper: get a permission by resource + action
  const perm = (resource, action) =>
    permissions.find((p) => p.resource === resource && p.action === action);

  // ─── 3. ROLE-PERMISSION MAPPINGS ─────────────────────────────────────────
  console.log('🔗 Assigning permissions to roles...');

  // ADMIN → everything
  const adminPerms = permissions.map((p) => ({
    roleId: adminRole.id,
    permissionId: p.id,
  }));

  // EMERGENCY_DISPATCHER → read users, read+manage system
  const dispatcherPerms = [
    { roleId: dispatcherRole.id, permissionId: perm('users', 'read').id },
    { roleId: dispatcherRole.id, permissionId: perm('system', 'read').id },
    { roleId: dispatcherRole.id, permissionId: perm('system', 'manage').id }, // "write system"
  ];

  // ROAD_OBSERVER → read users, read system
  const observerPerms = [
    { roleId: observerRole.id, permissionId: perm('users', 'read').id },
    { roleId: observerRole.id, permissionId: perm('system', 'read').id },
  ];

  // NODE_MAINTENANCE_CREW → read users, read system
  const maintenancePerms = [
    { roleId: maintenanceRole.id, permissionId: perm('users', 'read').id },
    { roleId: maintenanceRole.id, permissionId: perm('system', 'read').id },
  ];

  const allMappings = [
    ...adminPerms,
    ...dispatcherPerms,
    ...observerPerms,
    ...maintenancePerms,
  ];

  // Delete old mappings first (optional, but recommended to fix old mistakes)
  await prisma.rolePermission.deleteMany({});

  // Use createMany with skipDuplicates to safely re-run seed
  await prisma.rolePermission.createMany({
    data: allMappings,
    skipDuplicates: true,
  });

  console.log(`   ✅ ${allMappings.length} role-permission mappings created`);

  // ─── 4. USERS ─────────────────────────────────────────────────────────────
  console.log('👥 Creating users...');

  const defaultPassword = 'Test@123456';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // noureen ->  password: Nour@123
  const usersData = [
    {
      email:      'noureen@safespace.com',               
      fullName:   'Noureen Ahmed',
      username:   'noureen',
      nationalId: '29501150100125',
      employeeId: 'EMP-ADM-001',
      roleId:     adminRole.id,
    },
    {
      email:      'ahmed.hassan@safespace.com',
      fullName:   'Ahmed Hassan Mohamed',
      username:   'ahmed.hassan',
      nationalId: '28905230101234',
      employeeId: 'EMP-DIS-002',
      roleId:     dispatcherRole.id,
    },
    {
      email:      'fatma.said@safespace.com',
      fullName:   'Fatma Said Ibrahim',
      username:   'fatma.said',
      nationalId: '29208140200567',
      employeeId: 'EMP-OBS-003',
      roleId:     observerRole.id,
    },
    {
      email:      'mahmoud.ali@safespace.com',
      fullName:   'Mahmoud Ali Khalil',
      username:   'mahmoud.ali',
      nationalId: '28711190300891',
      employeeId: 'EMP-MNT-004',
      roleId:     maintenanceRole.id,
    },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email:              u.email,
        passwordHash:       passwordHash,
        roleId:             u.roleId,
        nationalId:         u.nationalId,
        employeeId:         u.employeeId,
        fullName:           u.fullName,
        username:           u.username,
        mustChangePassword: true,
        isActive:           true,
        isEmailVerified:    true,
      },
    });
    createdUsers.push(user);
  }
  console.log(`   ✅ ${createdUsers.length} users created`);

  // ─── 5. AUDIT LOG ────────────────────────────────────────────────────────
  const admin = createdUsers[0];
  await prisma.auditLog.create({
    data: {
      userId:    admin.id,
      role:      'admin',
      eventType: 'system_initialization',
      action:    'create',
      resource:  'database',
      details:   { message: 'Database initialized with seed data', users_created: 4 }, // matches your SQL exactly
      success:   true,
      ipAddress: '127.0.0.1',
    },
  });

  console.log('   ✅ Initial audit log entry created');

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed complete! Here are your users:\n');
  console.log('  Name                     Email                          Role');
  console.log('  ─────────────────────────────────────────────────────────────────');
  for (const u of usersData) {
    const role = roles.find((r) => r.id === u.roleId);
    console.log(`  ${u.fullName.padEnd(25)} ${u.email.padEnd(35)} ${role.name}`);
  }
  console.log('\n  Default password for ALL: Test@123456');
  console.log('  All users must change password on first login!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
