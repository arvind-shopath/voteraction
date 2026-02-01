const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Setting up fresh database for Laharpur (148)...');

    // Clear all existing data
    await prisma.publicRelation.deleteMany({});
    await prisma.socialPost.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.issue.deleteMany({});
    await prisma.worker.deleteMany({});
    await prisma.voter.deleteMany({});
    await prisma.booth.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.assembly.deleteMany({});


    console.log('Creating Assembly: 148 - Laharpur (Sitapur)...');
    const assembly = await prisma.assembly.create({
        data: {
            number: 148,
            name: 'लहरपुर',
            district: 'सीतापुर',
            state: 'Uttar Pradesh',
            candidateName: 'श्री सतीश कुमार',
            candidateImageUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            party: 'भाजपा (BJP)',
            logoUrl: '',
            themeColor: '#FF9933',
            prevPartyVotes: 99832,
            prevCandidateVotes: 101250,
            totalVoters: 0,  // Will be updated after PDF import
            totalBooths: 412
        }
    });

    console.log('Creating Users...');
    await prisma.user.create({
        data: { username: 'admin', role: 'ADMIN', name: 'Admin' }
    });

    const candidateUser = await prisma.user.create({
        data: {
            username: 'candidate',
            role: 'MANAGER',
            assemblyId: assembly.id,
            name: 'सतीश कुमार'
        }
    });

    console.log('✅ Base setup complete! Now import your PDF to add voter data.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
