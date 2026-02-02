const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('\n--- MANAGER USERS (Candidates) ---');
    const managers = await prisma.user.findMany({
        where: { role: 'MANAGER' }
    });
    managers.forEach(u => console.log(`  - ID: ${u.id}, Name: ${u.name}, AssemblyID: ${u.assemblyId}`));

    console.log('\n--- ASSEMBLIES (Candidate Names) ---');
    const assemblies = await prisma.assembly.findMany();
    assemblies.forEach(a => console.log(`  - ID: ${a.id}, Name: ${a.name}, Candidate: ${a.candidateName}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
