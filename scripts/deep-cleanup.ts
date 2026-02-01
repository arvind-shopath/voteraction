import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function cleanup() {
    console.log("Starting deep cleanup...");

    // 1. Ensure SuperAdmin exists
    const superAdminMobile = '9723338321';
    const hashedPassword = await bcrypt.hash('Aarya@101021', 10);

    const superAdmin = await prisma.user.findFirst({
        where: { mobile: superAdminMobile }
    });

    if (superAdmin) {
        await prisma.user.update({
            where: { id: superAdmin.id },
            data: {
                role: 'SUPERADMIN',
                password: hashedPassword,
                status: 'Active',
                name: 'Main Super Admin'
            }
        });
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
    }
    console.log("Super Admin verified.");

    // 2. Delete all other users
    const otherUsers = await prisma.user.deleteMany({
        where: {
            NOT: {
                mobile: superAdminMobile
            }
        }
    });
    console.log(`Deleted ${otherUsers.count} other users.`);

    // 3. Delete workers (they are mostly linked to deleted users, but just in case)
    await prisma.worker.deleteMany({});
    console.log("All workers deleted.");

    // 4. Delete assemblies except Sikta and Laharpur
    const assembliesToDelete = await prisma.assembly.findMany({
        where: {
            NOT: {
                name: {
                    in: ['Sikta', 'Laharpur', 'सिकटा', 'लहरपुर']
                }
            }
        }
    });

    for (const assembly of assembliesToDelete) {
        // We might need to delete related records first if not cascaded
        // But prisma deleteMany usually handles it if schema is right
        await prisma.assembly.delete({ where: { id: assembly.id } });
    }
    console.log(`Deleted ${assembliesToDelete.length} assemblies.`);

    // 5. Ensure Sikta and Laharpur exist if they don't
    const names = ['Sikta', 'Laharpur'];
    for (const name of names) {
        const existing = await prisma.assembly.findFirst({
            where: { name }
        });
        if (!existing) {
            await prisma.assembly.create({
                data: {
                    name,
                    number: name === 'Sikta' ? 1 : 2,
                    district: 'Unknown',
                    state: 'UP'
                }
            });
            console.log(`Created missing assembly: ${name}`);
        }
    }
}

cleanup()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
