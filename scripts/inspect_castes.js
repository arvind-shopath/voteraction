const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.voter.groupBy({
        by: ['casteCategory'],
        _count: { id: true }
    });
    console.log('Categories:', categories);

    const castes = await prisma.voter.groupBy({
        by: ['caste'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
    });
    console.log('Top castes:', castes.slice(0, 20));

    const subCastes = await prisma.voter.groupBy({
        by: ['subCaste'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
    });
    console.log('Top subcastes:', subCastes.slice(0, 20));
}

main().finally(() => prisma.$disconnect());
