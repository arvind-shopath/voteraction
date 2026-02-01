import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function cleanup() {
    console.log("Starting secure cleanup and SuperAdmin creation...");

    // 1. Create the new SuperAdmin
    const hashedPassword = await bcrypt.hash('Aarya@101021', 10);
    const superAdminMobile = '9723338321';

    const existingAdmin = await prisma.user.findFirst({
        where: { mobile: superAdminMobile }
    });

    if (existingAdmin) {
        await prisma.user.update({
            where: { id: existingAdmin.id },
            data: { role: 'SUPERADMIN', password: hashedPassword, status: 'Active' }
        });
        console.log("SuperAdmin updated: 9723338321 / Aarya@101021");
    } else {
        await prisma.user.create({
            data: {
                mobile: superAdminMobile,
                username: superAdminMobile,
                password: hashedPassword,
                role: 'SUPERADMIN',
                status: 'Active',
                name: 'Main Super Admin'
            }
        });
        console.log("New SuperAdmin created: 9723338321 / Aarya@101021");
    }

    // 2. Delete all Workers
    const deletedWorkers = await prisma.worker.deleteMany({});
    console.log(`Deleted ${deletedWorkers.count} workers.`);

    // 3. Delete all MANAGER users (Candidates) and WORKER users
    const deletedUsers = await prisma.user.deleteMany({
        where: {
            role: { in: ['MANAGER', 'WORKER'] }
        }
    });
    console.log(`Deleted ${deletedUsers.count} candidates/workers from User table.`);

    // Note: Assembly table is kept intact.
}

cleanup()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
