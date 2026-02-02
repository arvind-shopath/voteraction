const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Delete Social Media Users (ID 11-46)
    // We filter by role SOCIAL_MEDIA just to be safe, and IDs.
    const deleteUsers = await prisma.user.deleteMany({
        where: {
            role: 'SOCIAL_MEDIA',
            id: { gte: 11, lte: 46 }
        }
    });
    console.log(`Deleted ${deleteUsers.count} Social Media Users.`);

    // 2. Delete Assemblies 11 & 12
    const deleteAssemblies = await prisma.assembly.deleteMany({
        where: {
            id: { in: [11, 12] }
        }
    });
    console.log(`Deleted ${deleteAssemblies.count} Assemblies (duplicate/wrong).`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
