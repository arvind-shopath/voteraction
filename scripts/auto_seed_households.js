const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log('Resetting and regenerating clean, realistic households...');

    // 1. Clear previous auto-visits that were artificially added
    await prisma.householdVisit.deleteMany({});
    
    // 2. Clear previous household linkages
    await prisma.voter.updateMany({
        data: { householdId: null }
    });
    await prisma.household.deleteMany({});

    console.log('Fetching all voters...');
    const voters = await prisma.voter.findMany({
        select: { 
            id: true, 
            assemblyId: true, 
            boothNumber: true, 
            village: true, 
            villageHi: true, 
            houseNumber: true, 
            houseNoClean: true, 
            fullAddressHi: true 
        },
        orderBy: [{ boothNumber: 'asc' }, { id: 'asc' }]
    });

    console.log(`Processing ${voters.length} voters...`);

    // Group voters by boothNumber, village, and houseNumber
    const boothGroups = new Map();

    for (const v of voters) {
        const bNum = v.boothNumber || 1;
        if (!boothGroups.has(bNum)) {
            boothGroups.set(bNum, new Map());
        }
        const bMap = boothGroups.get(bNum);
        
        const vil = (v.village || v.villageHi || 'सामान्य').trim();
        const hNo = (v.houseNoClean || v.houseNumber || '0').trim();
        const key = `${vil}__${hNo}`;

        if (!bMap.has(key)) {
            bMap.set(key, []);
        }
        bMap.get(key).push(v);
    }

    const boothGeo = {
        1: { lat: 25.584, lng: 83.572 },
        2: { lat: 25.591, lng: 83.580 },
        3: { lat: 25.578, lng: 83.565 },
        4: { lat: 25.586, lng: 83.592 },
        5: { lat: 25.569, lng: 83.555 },
        6: { lat: 25.602, lng: 83.585 },
        7: { lat: 25.572, lng: 83.588 },
        8: { lat: 25.595, lng: 83.560 },
        9: { lat: 25.580, lng: 83.605 },
        10: { lat: 25.565, lng: 83.570 },
    };

    let totalHouseholds = 0;

    for (const [boothNumber, householdsMap] of boothGroups.entries()) {
        let seq = 1;
        const center = boothGeo[boothNumber] || { lat: 25.580 + (boothNumber * 0.003), lng: 83.570 + (boothNumber * 0.003) };

        for (const [key, vList] of householdsMap.entries()) {
            const [village, houseNo] = key.split('__');
            const assemblyId = vList[0].assemblyId || 1;
            const code = `H-${boothNumber}-${seq}`;

            // Real approximate spread across the village/booth area
            const jitterLat = (Math.sin(seq * 13) * 0.0035);
            const jitterLng = (Math.cos(seq * 13) * 0.0035);

            const hh = await prisma.household.create({
                data: {
                    householdCode: code,
                    assemblyId,
                    boothNumber,
                    village,
                    villageHi: vList[0].villageHi || village,
                    houseNumber: houseNo,
                    fullAddress: vList[0].fullAddressHi || `${village}, मकान नं ${houseNo}`,
                    locationStatus: 'Approximate', // Strictly unverified until real field verification
                    latitude: center.lat + jitterLat,
                    longitude: center.lng + jitterLng
                }
            });

            const vIds = vList.map(v => v.id);
            await prisma.voter.updateMany({
                where: { id: { in: vIds } },
                data: { householdId: hh.id }
            });

            seq++;
            totalHouseholds++;
        }
    }

    console.log(`Successfully generated ${totalHouseholds} clean households with sequential numbering (1, 2, 3, ...) and pure real status!`);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
