const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== SYNC BOOTH & VOTER NAMES ===');

    // 1. Fix Voter UP/49/234/0483005 (Shanti & Wadhu)
    const shanti = await prisma.voter.findFirst({ where: { epic: { contains: '0483005' } } });
    if (shanti) {
        await prisma.voter.update({
            where: { id: shanti.id },
            data: {
                relativeName: 'वाढू',
                relativeNameHi: 'वाढू',
                relativeNameEn: 'Wadhu'
            }
        });
        console.log('Updated voter 0483005 relative name to वाढू / Wadhu');
    }

    // 2. Fix village "Sauri" -> "सौरी" across all voters
    const sauriVoters = await prisma.voter.updateMany({
        where: {
            OR: [
                { village: 'Sauri' },
                { villageHi: 'Sauri' },
                { village: null }
            ]
        },
        data: {
            village: 'सौरी',
            villageHi: 'सौरी',
            villageEn: 'Sauri',
            area: 'सौरी'
        }
    });
    console.log(`Updated ${sauriVoters.count} voters village to "सौरी"`);

    // 3. Fix relative name "बाळू" / "बालू" -> "वाढू" for all voters in DB
    const baluVoters = await prisma.voter.updateMany({
        where: {
            OR: [
                { relativeName: 'बाळू' },
                { relativeNameHi: 'बाळू' },
                { relativeName: 'बालू' },
                { relativeNameHi: 'बालू' }
            ]
        },
        data: {
            relativeName: 'वाढू',
            relativeNameHi: 'वाढू',
            relativeNameEn: 'Wadhu'
        }
    });
    console.log(`Updated ${baluVoters.count} voters relativeName from बाळू to वाढू`);

    // 4. Update fullAddressHi for all voters if missing or containing "Sauri"
    const votersToFixAddr = await prisma.voter.findMany({
        where: {
            OR: [
                { fullAddressHi: null },
                { fullAddressHi: { contains: 'Sauri' } }
            ]
        },
        select: { id: true, houseNumber: true, village: true, villageHi: true }
    });

    for (const v of votersToFixAddr) {
        const vName = v.villageHi || v.village || 'सौरी';
        const hNo = v.houseNumber ? `मकान संख्या: ${v.houseNumber}, ` : '';
        await prisma.voter.update({
            where: { id: v.id },
            data: {
                fullAddressHi: `${hNo}${vName}`,
                fullAddressEn: v.houseNumber ? `House No: ${v.houseNumber}, Sauri` : 'Sauri'
            }
        });
    }
    console.log(`Updated fullAddressHi for ${votersToFixAddr.length} voters.`);

    // 5. Auto-populate Booth table names for all assemblies
    const assemblies = await prisma.assembly.findMany({ select: { id: true, number: true, name: true } });

    for (const a of assemblies) {
        // Group voters by boothNumber to find dominant village
        const voterBooths = await prisma.voter.groupBy({
            by: ['boothNumber', 'villageHi', 'village'],
            where: { assemblyId: a.id, boothNumber: { not: null } },
            _count: { id: true }
        });

        const boothVillageMap = new Map();
        for (const vb of voterBooths) {
            const bNum = vb.boothNumber;
            const vName = vb.villageHi || vb.village;
            if (bNum && vName && !boothVillageMap.has(bNum)) {
                boothVillageMap.set(bNum, vName);
            }
        }

        // Fetch registered booths
        const booths = await prisma.booth.findMany({ where: { assemblyId: a.id } });

        for (const b of booths) {
            const inferredVillage = boothVillageMap.get(b.number) || 'सौरी';
            const curName = b.nameHi || b.name || '';
            const isGeneric = !curName || curName.startsWith('Booth') || curName.startsWith('बूथ नंबर');

            if (isGeneric) {
                const newNameHi = inferredVillage;
                const newNameEn = inferredVillage === 'सौरी' ? 'Sauri' : inferredVillage;
                await prisma.booth.update({
                    where: { id: b.id },
                    data: {
                        name: newNameHi,
                        nameHi: newNameHi,
                        nameEn: newNameEn,
                        villageNameHi: newNameHi,
                        villageNameEn: newNameEn
                    }
                });
                console.log(`Assembly #${a.number} Booth #${b.number} name set to "${newNameHi}"`);
            }
        }
    }

    console.log('=== SYNC COMPLETED SUCCESSFULLY ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
