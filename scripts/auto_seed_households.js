const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Deterministic 2D distribution function
function getRealisticOffset(seedStr, stdDev = 0.0035) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0;
    }
    const u1 = Math.abs(Math.sin(hash * 12.9898)) % 1;
    const u2 = Math.abs(Math.cos(hash * 78.233)) % 1;
    
    // Box-Muller transform for Gaussian scatter along roads & streets
    const r = Math.sqrt(-2.0 * Math.log(Math.max(1e-5, u1))) * stdDev;
    const theta = 2.0 * Math.PI * u2;
    
    return {
        dLat: r * Math.sin(theta),
        dLng: r * Math.cos(theta)
    };
}

const BOOTH_CENTROIDS = {
    1: { lat: 25.5920, lng: 83.5680 }, // सौरी
    2: { lat: 25.5830, lng: 83.5780 }, // महुआबाग
    3: { lat: 25.5750, lng: 83.5820 }, // लंका / विशेश्वरगंज
    4: { lat: 25.5680, lng: 83.5620 }, // गोराबाजार
    5: { lat: 25.5980, lng: 83.5550 }, // रौज़ा / नुरुद्दीनपुरा
    6: { lat: 25.6050, lng: 83.5880 }, // रजदेपुर
    7: { lat: 25.5800, lng: 83.5750 }, // मिश्रबाजार
    8: { lat: 25.5600, lng: 83.5900 }, // बिंदोलिया
    9: { lat: 25.5880, lng: 83.6020 }, // सुखदेवपुर
    10: { lat: 25.5720, lng: 83.5700 }, // फतेहउल्लाहपुर
};

async function run() {
    console.log('Regenerating households with realistic natural spatial distribution (no circles)...');

    // 1. Clear previous records
    await prisma.householdVisit.deleteMany({});
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

    let totalHouseholds = 0;

    for (const [boothNumber, householdsMap] of boothGroups.entries()) {
        let seq = 1;
        const center = BOOTH_CENTROIDS[boothNumber] || { lat: 25.580 + (boothNumber * 0.003), lng: 83.570 + (boothNumber * 0.003) };

        for (const [key, vList] of householdsMap.entries()) {
            const [village, houseNo] = key.split('__');
            const assemblyId = vList[0].assemblyId || 1;
            const code = `H-${boothNumber}-${seq}`;

            // Natural 2D distribution based on booth and house unique seed
            const offset = getRealisticOffset(`b_${boothNumber}_v_${village}_h_${houseNo}_${seq}`, 0.0040);

            const hh = await prisma.household.create({
                data: {
                    householdCode: code,
                    assemblyId,
                    boothNumber,
                    village,
                    villageHi: vList[0].villageHi || village,
                    houseNumber: houseNo,
                    fullAddress: vList[0].fullAddressHi || `${village}, मकान नं ${houseNo}`,
                    locationStatus: 'Approximate',
                    latitude: center.lat + offset.dLat,
                    longitude: center.lng + offset.dLng
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

    console.log(`Successfully generated ${totalHouseholds} households distributed realistically across Ghazipur neighborhoods!`);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
