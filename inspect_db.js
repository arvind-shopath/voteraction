const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- ASSEMBLIES ---');
    const assemblies = await prisma.assembly.findMany({
        include: { campaigns: true }
    });
    assemblies.forEach(a => {
        console.log(`ID: ${a.id} | Name: ${a.name} | Number: ${a.number} | State: ${a.state} | District: ${a.district}`);
        if (a.campaigns.length > 0) {
            console.log('  Campaigns:');
            a.campaigns.forEach(c => console.log(`    - ID: ${c.id}Name: ${c.name}, Candidate: ${c.candidateName}`));
        }
    });

    console.log('\n--- USERS (CreatiAV Team) ---');
    // Assuming 'CreatiAV' might be in the name or associated via some logic. 
    // The user said "CreatiAV social media team (36) ke sabhi user". 
    // I'll search for users with typically social media roles or specific naming patterns if possible, 
    // but better to list all to be safe or filter by a specific assembly if I find the 'CreatiAV' assembly.

    // Let's look for users linked to the assemblies we might find.
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
