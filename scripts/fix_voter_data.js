const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== STARTING VOTER DATA & FAMILY RE-CLUSTERING CLEANUP ===");

    // 1. Specific fixes for reported voters
    const specificVoters = [
        {
            epic: 'JCV3598026',
            data: {
                name: 'Ramesh',
                nameEn: 'Ramesh',
                nameHi: 'रमेश',
                age: 47,
                gender: 'M',
                relativeName: 'Kalika',
                relativeNameEn: 'Kalika',
                relativeNameHi: 'कालिका',
                relationType: 'Father',
                houseNumber: '1',
                village: 'Sauri',
                villageEn: 'Sauri',
                villageHi: 'सौरी',
                area: 'मकान संख्या: 1, अनुभाग 1-सौरी',
                fullAddressHi: 'मकान संख्या: 1, सौरी',
                fullAddressEn: 'House No: 1, Sauri',
                boothNumber: 1
            }
        },
        {
            epic: 'SQH0414102',
            data: {
                name: 'Pooja',
                nameEn: 'Pooja',
                nameHi: 'पूजा',
                age: 35,
                gender: 'F',
                relativeName: 'Sandeep',
                relativeNameEn: 'Sandeep',
                relativeNameHi: 'संदीप',
                relationType: 'Husband',
                houseNumber: '1',
                village: 'Sauri',
                villageEn: 'Sauri',
                villageHi: 'सौरी',
                area: 'मकान संख्या: 1, अनुभाग 1-सौरी',
                fullAddressHi: 'मकान संख्या: 1, सौरी',
                fullAddressEn: 'House No: 1, Sauri',
                boothNumber: 1
            }
        },
        {
            epic: 'SQH0413153',
            data: {
                name: 'Sandeep Prajapati',
                nameEn: 'Sandeep Prajapati',
                nameHi: 'संदीप प्रजापति',
                age: 34,
                gender: 'M',
                relativeName: 'Kalika',
                relativeNameEn: 'Kalika',
                relativeNameHi: 'कालिका',
                relationType: 'Father',
                houseNumber: '1',
                village: 'Sauri',
                villageEn: 'Sauri',
                villageHi: 'सौरी',
                area: 'मकान संख्या: 1, अनुभाग 1-सौरी',
                fullAddressHi: 'मकान संख्या: 1, सौरी',
                fullAddressEn: 'House No: 1, Sauri',
                boothNumber: 1
            }
        },
        {
            epic: 'SQH0413278',
            data: {
                name: 'Nirmala',
                nameEn: 'Nirmala',
                nameHi: 'निर्मला',
                age: 35,
                gender: 'F',
                relativeName: 'Abhishek',
                relativeNameEn: 'Abhishek',
                relativeNameHi: 'अभिषेक',
                relationType: 'Husband',
                houseNumber: '1',
                village: 'Sauri',
                villageEn: 'Sauri',
                villageHi: 'सौरी',
                area: 'मकान संख्या: 1, अनुभाग 1-सौरी',
                fullAddressHi: 'मकान संख्या: 1, सौरी',
                fullAddressEn: 'House No: 1, Sauri',
                boothNumber: 1
            }
        },
        {
            epic: 'SQH2872083',
            data: {
                name: 'Dinesh Kumar',
                nameEn: 'Dinesh Kumar',
                nameHi: 'दिनेश कुमार',
                age: 24,
                gender: 'M',
                relativeName: 'Urmila Devi',
                relativeNameEn: 'Urmila Devi',
                relativeNameHi: 'उर्मिला देवी',
                relationType: 'Mother',
                houseNumber: '1',
                village: 'Sauri',
                villageEn: 'Sauri',
                villageHi: 'सौरी',
                area: 'मकान संख्या: 1, अनुभाग 1-सौरी',
                fullAddressHi: 'मकान संख्या: 1, सौरी',
                fullAddressEn: 'House No: 1, Sauri',
                boothNumber: 1
            }
        },
        {
            epic: 'SQH2870103',
            data: {
                name: 'Ravi Prajapati',
                nameEn: 'Ravi Prajapati',
                nameHi: 'रवि प्रजापति',
                age: 21,
                gender: 'M',
                relativeName: 'Rajdev Prajapati',
                relativeNameEn: 'Rajdev Prajapati',
                relativeNameHi: 'राजदेव प्रजापति',
                relationType: 'Father',
                houseNumber: '1',
                village: 'Sauri',
                villageEn: 'Sauri',
                villageHi: 'सौरी',
                area: 'मकान संख्या: 1, अनुभाग 1-सौरी',
                fullAddressHi: 'मकान संख्या: 1, सौरी',
                fullAddressEn: 'House No: 1, Sauri',
                boothNumber: 1
            }
        }
    ];

    for (const item of specificVoters) {
        const existing = await prisma.voter.findUnique({ where: { epic: item.epic } });
        if (existing) {
            console.log(`Updating voter ${item.epic} (${item.data.nameHi})...`);
            await prisma.voter.update({
                where: { epic: item.epic },
                data: item.data
            });
        } else {
            console.log(`Creating voter ${item.epic} (${item.data.nameHi})...`);
            await prisma.voter.create({
                data: {
                    epic: item.epic,
                    ...item.data,
                    assemblyId: 14,
                    supportStatus: 'Neutral',
                    status: 'Active'
                }
            });
        }
    }

    // Fix booth names for Booth #1 (Sauri)
    const assemblies = await prisma.assembly.findMany();
    for (const ass of assemblies) {
        await prisma.booth.upsert({
            where: {
                number_assemblyId: {
                    number: 1,
                    assemblyId: ass.id
                }
            },
            create: {
                number: 1,
                assemblyId: ass.id,
                name: 'प्रा वि सौरी',
                nameHi: 'प्रा वि सौरी',
                nameEn: 'Pra Vi Sauri',
                villageNameHi: 'सौरी',
                villageNameEn: 'Sauri'
            },
            update: {
                name: 'प्रा वि सौरी',
                nameHi: 'प्रा वि सौरी',
                nameEn: 'Pra Vi Sauri',
                villageNameHi: 'सौरी',
                villageNameEn: 'Sauri'
            }
        });
    }

    // 2. Re-cluster all voters into families based on (assemblyId, boothNumber, village, normalizedHouseNumber)
    console.log("Re-clustering all families across database...");
    const allVoters = await prisma.voter.findMany();
    console.log(`Total voters to process: ${allVoters.length}`);

    // Map familyId to list of voter IDs
    const familyMap = new Map();

    for (const v of allVoters) {
        const rawHouse = (v.houseNumber || '').trim().replace(/^0+([1-9])/, '$1').replace(/^0+$/, '0');
        const normHouse = rawHouse || 'UNASSIGNED';
        const normVillage = (v.village || 'v').replace(/[\s.]+/g, '').toLowerCase();
        const boothNum = v.boothNumber || 1;
        const familyId = `FAM_${v.assemblyId}_B${boothNum}_${normVillage}_H${normHouse}`;

        if (!familyMap.has(familyId)) {
            familyMap.set(familyId, []);
        }
        familyMap.get(familyId).push({ id: v.id, houseNumber: normHouse, familyId });
    }

    console.log(`Unique family IDs generated: ${familyMap.size}`);

    // Update DB voters with normalized houseNumber, familyId, and familySize
    let updatedCount = 0;
    for (const [famId, members] of familyMap.entries()) {
        const size = members.length;
        for (const m of members) {
            await prisma.voter.update({
                where: { id: m.id },
                data: {
                    houseNumber: m.houseNumber,
                    familyId: famId,
                    familySize: size
                }
            });
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} voters with new family IDs and sizes.`);

    // Check specific family for House #1 in Sauri
    const sauriHouse1 = await prisma.voter.findMany({
        where: {
            OR: [
                { epic: 'JCV3598026' },
                { epic: 'SQH0414102' },
                { epic: 'SQH0413153' },
                { epic: 'SQH0413278' },
                { epic: 'SQH2872083' },
                { epic: 'SQH2870103' }
            ]
        }
    });

    console.log("\n--- VERIFICATION: Sauri House #1 Voters ---");
    sauriHouse1.forEach(v => {
        console.log(`Name: ${v.nameHi} | Rel: (${v.relationType}) ${v.relativeNameHi} | House: ${v.houseNumber} | FamilyId: ${v.familyId} | Size: ${v.familySize}`);
    });

    console.log("=== VOTER DATA CLEANUP COMPLETED SUCCESSFULLY ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
