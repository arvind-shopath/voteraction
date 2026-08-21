const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeHouseNumber(str) {
    if (!str) return '1';
    const devanagariMap = {
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
        '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
    };
    let clean = String(str).replace(/[०-९]/g, d => devanagariMap[d] || d).trim();
    // Remove leading zeroes e.g. '03' -> '3', '001' -> '1'
    clean = clean.replace(/^0+(?=\d)/, '');
    return clean || '1';
}

function getNumericValue(hNo) {
    const match = hNo.match(/\d+/);
    if (!match) return 0;
    const base = parseInt(match[0], 10);
    // If suffix exists like 'क' or 'A', add slight offset so 14क comes right after 14
    const suffix = hNo.replace(match[0], '').trim();
    if (suffix) {
        return base + 0.1;
    }
    return base;
}

// Deterministic 2D distribution function
function getRealisticOffset(seedStr, stdDev = 0.0035) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0;
    }
    const u1 = Math.abs(Math.sin(hash * 12.9898)) % 1;
    const u2 = Math.abs(Math.cos(hash * 78.233)) % 1;
    
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
    console.log('Regenerating households with English standard numbers (1, 2, 3, 4, 5...) and strict numeric sorting...');

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
        const rawHNo = v.houseNoClean || v.houseNumber || '1';
        const cleanHNo = normalizeHouseNumber(rawHNo);
        const key = `${vil}__${cleanHNo}`;

        if (!bMap.has(key)) {
            bMap.set(key, []);
        }
        bMap.get(key).push(v);
    }

    let totalHouseholds = 0;

    for (const [boothNumber, householdsMap] of boothGroups.entries()) {
        const center = BOOTH_CENTROIDS[boothNumber] || { lat: 25.580 + (boothNumber * 0.003), lng: 83.570 + (boothNumber * 0.003) };

        // Sort households strictly numerically by English house numbers (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12...)
        const sortedEntries = Array.from(householdsMap.entries()).sort((a, b) => {
            const [vilA, hNoA] = a[0].split('__');
            const [vilB, hNoB] = b[0].split('__');
            if (vilA !== vilB) return vilA.localeCompare(vilB);
            
            const numA = getNumericValue(hNoA);
            const numB = getNumericValue(hNoB);
            if (numA !== numB) return numA - numB;
            return hNoA.localeCompare(hNoB);
        });

        let seq = 1;
        for (const [key, vList] of sortedEntries) {
            const [village, houseNo] = key.split('__');
            const assemblyId = vList[0].assemblyId || 1;
            const code = `H-${boothNumber}-${seq}`;

            const offset = getRealisticOffset(`b_${boothNumber}_v_${village}_h_${houseNo}_${seq}`, 0.0040);

            const hh = await prisma.household.create({
                data: {
                    householdCode: code,
                    assemblyId,
                    boothNumber,
                    village,
                    villageHi: vList[0].villageHi || village,
                    houseNumber: houseNo, // English number e.g. "1", "2", "3", "4"...
                    fullAddress: `${village}, मकान नं ${houseNo}`,
                    locationStatus: 'Approximate',
                    latitude: center.lat + offset.dLat,
                    longitude: center.lng + offset.dLng
                }
            });

            const vIds = vList.map(v => v.id);
            await prisma.voter.updateMany({
                where: { id: { in: vIds } },
                data: { 
                    householdId: hh.id,
                    houseNoClean: houseNo
                }
            });

            seq++;
            totalHouseholds++;
        }
    }

    console.log(`Successfully created ${totalHouseholds} households with 1, 2, 3, 4, 5... standard English numbers!`);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
