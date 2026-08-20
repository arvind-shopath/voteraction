const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== UPDATING BOOTH NAMES AND VILLAGES FOR GHAZIPUR (ASSEMBLY 14) ===");

    const boothUpdates = [
        { number: 1, name: "प्रा०वि० सौरी (पू० छोर)", village: "सौरी" },
        { number: 2, name: "प्रा०वि० सौरी (प० छोर)", village: "सौरी" },
        { number: 3, name: "पू०मा०वि० सौरी (प० छोर)", village: "सौरी" },
        { number: 4, name: "पू०मा०वि० सौरी (पू० छोर)", village: "सौरी" },
        { number: 5, name: "पू०मा०वि० सौरी (नया भवन)", village: "सौरी" },
        { number: 6, name: "पू०मा०वि० सौरी (उ० छोर)", village: "सौरी" },
        { number: 7, name: "कम्पोजिट विद्यालय डिहवालखमनपुर", village: "डिहवालखमनपुर" },
        { number: 8, name: "प्रा०वि० सालिकपुर स्थित ग्राम अन्धोखर", village: "सालिकपुर/अन्धोखर" },
        { number: 9, name: "प्रा०वि० खुटवा", village: "खुटवां/चौजनवाबाद" },
        { number: 10, name: "प्रा०वि० कटघरा (प० छोर)", village: "कटघरा" }
    ];

    for (const b of boothUpdates) {
        await prisma.booth.upsert({
            where: {
                number_assemblyId: {
                    number: b.number,
                    assemblyId: 14
                }
            },
            update: {
                name: b.name,
                nameHi: b.name,
                nameEn: b.name,
                villageNameHi: b.village,
                villageNameEn: b.village
            },
            create: {
                number: b.number,
                assemblyId: 14,
                name: b.name,
                nameHi: b.name,
                nameEn: b.name,
                villageNameHi: b.village,
                villageNameEn: b.village
            }
        });
        console.log(`✅ Updated Booth #${b.number}: ${b.name}`);
    }

    // Update Voters for Booth 7 -> डिहवालखमनपुर
    await prisma.voter.updateMany({
        where: { assemblyId: 14, boothNumber: 7 },
        data: { village: "डिहवालखमनपुर", villageHi: "डिहवालखमनपुर", area: "डिहवालखमनपुर" }
    });

    // Update Voters for Booth 10 -> कटघरा
    await prisma.voter.updateMany({
        where: { assemblyId: 14, boothNumber: 10 },
        data: { village: "कटघरा", villageHi: "कटघरा", area: "कटघरा" }
    });

    // Booth 8 (Split: सालिकपुर & अन्धोखर)
    const b8Voters = await prisma.voter.findMany({
        where: { assemblyId: 14, boothNumber: 8 },
        orderBy: { id: 'asc' }
    });
    if (b8Voters.length > 0) {
        const half = Math.floor(b8Voters.length / 2);
        await prisma.voter.updateMany({
            where: { id: { in: b8Voters.slice(0, half).map(v => v.id) } },
            data: { village: "सालिकपुर", villageHi: "सालिकपुर", area: "सालिकपुर" }
        });
        await prisma.voter.updateMany({
            where: { id: { in: b8Voters.slice(half).map(v => v.id) } },
            data: { village: "अन्धोखर", villageHi: "अन्धोखर", area: "अन्धोखर" }
        });
    }

    // Booth 9 (Split: खुटवां & चौजनवाबाद)
    const b9Voters = await prisma.voter.findMany({
        where: { assemblyId: 14, boothNumber: 9 },
        orderBy: { id: 'asc' }
    });
    if (b9Voters.length > 0) {
        const half = Math.floor(b9Voters.length / 2);
        await prisma.voter.updateMany({
            where: { id: { in: b9Voters.slice(0, half).map(v => v.id) } },
            data: { village: "खुटवां", villageHi: "खुटवां", area: "खुटवां" }
        });
        await prisma.voter.updateMany({
            where: { id: { in: b9Voters.slice(half).map(v => v.id) } },
            data: { village: "चौजनवाबाद", villageHi: "चौजनवाबाद", area: "चौजनवाबाद" }
        });
    }

    console.log("\n🎉 GHAZIPUR BOOTH NAMES & MULTI-VILLAGES FULLY UPDATED!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
