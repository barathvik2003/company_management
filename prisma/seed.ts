/**
 * Development seed.
 *
 * Everything created here is DEMO DATA. The passwords are public and weak on
 * purpose — the script refuses to run when NODE_ENV=production.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ALL_PERMISSIONS, describePermission, ROLE_MATRIX, RoleName } from '../packages/shared/src';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo@Pass123';
const BCRYPT_ROUNDS = 12;

const ROLE_LABELS: Record<RoleName, { label: string; description: string }> = {
  COMPANY_HEAD: { label: 'Company head', description: 'Full visibility across the company' },
  ADMIN: { label: 'Administrator', description: 'Manages users, departments and settings' },
  MANAGER: { label: 'Manager', description: 'Runs a department and its team' },
  EMPLOYEE: { label: 'Employee', description: 'Works on their own targets, customers and tasks' },
  FINANCE: { label: 'Finance', description: 'Owns revenue, expenses and financial reporting' },
};

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo data into a production database.');
  }

  console.log('Seeding demo data...');

  // ---------------------------------------------------------------- permissions
  for (const key of ALL_PERMISSIONS) {
    const { resource, action, label } = describePermission(key);
    await prisma.permission.upsert({
      where: { key },
      update: { resource, action, label },
      create: { key, resource, action, label },
    });
  }
  console.log(`  ${ALL_PERMISSIONS.length} permissions`);

  // ---------------------------------------------------------------- roles
  for (const [name, grants] of Object.entries(ROLE_MATRIX) as [RoleName, typeof ROLE_MATRIX[RoleName]][]) {
    const meta = ROLE_LABELS[name];
    const role = await prisma.role.upsert({
      where: { name },
      update: { label: meta.label, description: meta.description },
      create: { name, label: meta.label, description: meta.description, isSystem: true },
    });

    // Rewrite the grants so the matrix in code is always the source of truth.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const permissions = await prisma.permission.findMany({
      where: { key: { in: grants.map((g) => g.key) } },
      select: { id: true, key: true },
    });
    const byKey = new Map(permissions.map((p) => [p.key, p.id]));
    await prisma.rolePermission.createMany({
      data: grants
        .filter((g) => byKey.has(g.key))
        .map((g) => ({ roleId: role.id, permissionId: byKey.get(g.key) as string, scope: g.scope })),
    });
  }
  console.log(`  ${Object.keys(ROLE_MATRIX).length} roles`);

  // ---------------------------------------------------------------- company
  const company = await prisma.company.upsert({
    where: { code: 'DEMO' },
    update: {},
    create: {
      name: 'Demo Industries Pvt Ltd',
      code: 'DEMO',
      address: '12 Industrial Estate, Coimbatore, Tamil Nadu',
      phone: '+91 422 000 0000',
      email: 'office@demo-industries.example',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    },
  });

  // ---------------------------------------------------------------- departments
  const departmentSeeds = [
    { name: 'Sales', code: 'SALES' },
    { name: 'Engineering', code: 'ENG' },
    { name: 'Finance', code: 'FIN' },
    { name: 'Operations', code: 'OPS' },
    { name: 'Support', code: 'SUP' },
  ];
  const departments = new Map<string, string>();
  for (const dept of departmentSeeds) {
    const created = await prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: dept.code } },
      update: {},
      create: { companyId: company.id, name: dept.name, code: dept.code },
    });
    departments.set(dept.code, created.id);
  }
  console.log(`  ${departmentSeeds.length} departments`);

  // ---------------------------------------------------------------- people
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  const people = [
    { first: 'Anitha', last: 'Raman', email: 'head@demo.local', code: 'DEMO-0001', role: RoleName.COMPANY_HEAD, dept: 'OPS', designation: 'Managing Director' },
    { first: 'Vikram', last: 'Shah', email: 'admin@demo.local', code: 'DEMO-0002', role: RoleName.ADMIN, dept: 'OPS', designation: 'IT Administrator' },
    { first: 'Priya', last: 'Nair', email: 'manager@demo.local', code: 'DEMO-0003', role: RoleName.MANAGER, dept: 'SALES', designation: 'Sales Manager' },
    { first: 'Karthik', last: 'Subramani', email: 'employee@demo.local', code: 'DEMO-0004', role: RoleName.EMPLOYEE, dept: 'SALES', designation: 'Sales Executive' },
    { first: 'Meera', last: 'Joseph', email: 'finance@demo.local', code: 'DEMO-0005', role: RoleName.FINANCE, dept: 'FIN', designation: 'Finance Controller' },
    { first: 'Suresh', last: 'Kumar', email: 'employee2@demo.local', code: 'DEMO-0006', role: RoleName.EMPLOYEE, dept: 'SALES', designation: 'Sales Executive' },
    { first: 'Divya', last: 'Pillai', email: 'engineer@demo.local', code: 'DEMO-0007', role: RoleName.EMPLOYEE, dept: 'ENG', designation: 'Software Engineer' },
  ];

  const createdUsers = new Map<string, string>();

  for (const person of people) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: person.role } });
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: {},
      create: {
        companyId: company.id,
        email: person.email,
        passwordHash,
        firstName: person.first,
        lastName: person.last,
        phone: '+91 90000 0000',
        status: 'ACTIVE',
        // Demo accounts skip the forced change so you can log straight in.
        mustChangePassword: false,
        roles: { create: { roleId: role.id } },
        employeeProfile: {
          create: {
            companyId: company.id,
            employeeCode: person.code,
            departmentId: departments.get(person.dept) ?? null,
            designation: person.designation,
            joiningDate: new Date('2025-04-01'),
            employmentStatus: 'PERMANENT',
            location: 'Coimbatore',
          },
        },
      },
    });
    createdUsers.set(person.email, user.id);
  }
  console.log(`  ${people.length} users with employee profiles`);

  // The sales manager runs the Sales department; sales staff report to her.
  const managerId = createdUsers.get('manager@demo.local');
  const salesDeptId = departments.get('SALES');
  if (managerId && salesDeptId) {
    await prisma.department.update({ where: { id: salesDeptId }, data: { managerId } });
    await prisma.employeeProfile.updateMany({
      where: { departmentId: salesDeptId, userId: { not: managerId } },
      data: { reportsToId: managerId },
    });
  }

  await prisma.systemSetting.upsert({
    where: { companyId_key: { companyId: company.id, key: 'demo_data' } },
    update: { value: { seeded: true, seededAt: new Date().toISOString() } },
    create: {
      companyId: company.id,
      key: 'demo_data',
      value: { seeded: true, seededAt: new Date().toISOString() },
    },
  });

  console.log('\nDemo accounts (all use the same password):');
  console.log(`  password: ${DEMO_PASSWORD}`);
  for (const person of people) {
    console.log(`  ${person.role.padEnd(13)} ${person.email}`);
  }
  console.log('\nThis is demo data. Never load it into a production database.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
