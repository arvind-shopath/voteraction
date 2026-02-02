const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- USERS in Assembly 11 (Sikta UP) & 12 (Laharpur UP) ---');
    const usersToDelete = await prisma.user.findMany({
        where: {
            assemblyId: { in: [11, 12] }
        }
    });
    console.log(`Found ${usersToDelete.length} users in ID 11 & 12`);
    usersToDelete.forEach(u => console.log(`  - ID: ${u.id}, Name: ${u.name}, Role: ${u.role}, Phone: ${u.mobile}`));

    console.log('\n--- ALL SOCIAL MEDIA USERS ---');
    const socialUsers = await prisma.user.findMany({
        where: { role: 'SOCIAL_MEDIA' }
    });
    socialUsers.forEach(u => console.log(`  - ID: ${u.id}, Name: ${u.name}, AssemblyID: ${u.assemblyId}`));

    console.log('\n--- CANDIDATES / CAMPAIGNS ---');
    const campaigns = await prisma.campaign.findMany({
        include: { assembly: true }
    });
    campaigns.forEach(c => console.log(`  - ID: ${c.id}, Name: ${c.name}, Candidate: ${c.candidateName}, Assembly: ${c.assembly?.name} (${c.assembly?.state})`));

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
