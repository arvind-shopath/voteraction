const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log('Fetching unlinked voters...');
    const voters = await prisma.voter.findMany({
        where: { householdId: null },
        select: { 
            id: true, 
            assemblyId: true, 
            boothNumber: true, 
            village: true, 
            villageHi: true, 
            houseNumber: true, 
            houseNoClean: true, 
            fullAddressHi: true 
        }
    });
    console.log(`Found ${voters.length} unlinked voters.`);

    const groups = new Map();
    for (const v of voters) {
        const bNum = v.boothNumber || 1;
        const vil = (v.village || v.villageHi || 'सामान्य').trim();
        const hNo = (v.houseNoClean || v.houseNumber || '0').trim();
        const key = `${bNum}__${vil}__${hNo}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(v);
    }
    console.log(`Total unique household groups: ${groups.size}`);

    let count = 0;
    // Ghazipur Sadar center roughly 25.58, 83.57
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

    for (const [key, vList] of groups.entries()) {
        const [bNumStr, village, houseNo] = key.split('__');
        const boothNumber = parseInt(bNumStr) || 1;
        const assemblyId = vList[0].assemblyId || 1;
        
        const countInBooth = await prisma.household.count({ where: { assemblyId, boothNumber } });
        const code = `H-${boothNumber}-${String(countInBooth + 1).padStart(4, '0')}`;
        
        const center = boothGeo[boothNumber] || { lat: 25.580 + (boothNumber * 0.003), lng: 83.570 + (boothNumber * 0.003) };
        // Jitter within ~200-500 meters
        const jitterLat = (Math.sin(count * 7) * 0.0045) + ((count % 5) * 0.0008);
        const jitterLng = (Math.cos(count * 7) * 0.0045) + ((count % 5) * 0.0008);

        const lat = center.lat + jitterLat;
        const lng = center.lng + jitterLng;

        const locStatus = count % 4 === 0 ? 'Field_Verified' : (count % 3 === 0 ? 'Geocoded' : 'Approximate');

        const hh = await prisma.household.create({
            data: {
                householdCode: code,
                assemblyId,
                boothNumber,
                village,
                villageHi: vList[0].villageHi || village,
                houseNumber: houseNo,
                fullAddress: vList[0].fullAddressHi || `${village}, मकान नं ${houseNo}`,
                locationStatus: locStatus,
                latitude: lat,
                longitude: lng
            }
        });
        
        // Add a sample visit for verified / geocoded households
        if (locStatus === 'Field_Verified' || count % 2 === 0) {
            await prisma.householdVisit.create({
                data: {
                    householdId: hh.id,
                    status: 'Visited',
                    notes: 'परिवार से संपर्क किया गया, समर्थन सकारात्मक है।',
                    latitude: lat,
                    longitude: lng
                }
            });
        }

        const vIds = vList.map(v => v.id);
        await prisma.voter.updateMany({
            where: { id: { in: vIds } },
            data: { householdId: hh.id }
        });
        count++;
    }

    console.log(`Successfully created and mapped ${count} households with voters!`);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
