const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== CURRENT USERS IN DATABASE ===");
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            username: true,
            mobile: true,
            role: true,
            assemblyId: true,
            campaignId: true
        }
    });
    console.table(users);

    console.log("\n=== ASSEMBLIES & VOTER COUNTS ===");
    const assemblies = await prisma.assembly.findMany({
        select: {
            id: true,
            name: true,
            nameHindi: true,
            number: true,
            district: true,
            _count: {
                select: { voters: true }
            }
        }
    });

    const mapped = assemblies.map(a => ({
        id: a.id,
        name: a.nameHindi || a.name,
        number: a.number,
        district: a.district,
        voterCount: a._count.voters
    }));
    console.table(mapped);
}

main().catch(console.error).finally(() => prisma.$disconnect());
